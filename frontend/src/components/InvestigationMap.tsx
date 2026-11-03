"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
// NOTE: MapLibre CSS is imported in globals.css (not here) to avoid
// lightningcss native-binding crash on Linux CI runners.
import type { CameraDto, TrajectoryPointDto } from "@/lib/api";
import { fetchRoadRoute } from "@/lib/routing";
import { getHardcodedRoute } from "@/lib/hardcodedPaths";
import { resolveRtoArea, WHOLE_INDIA_CENTER, WHOLE_INDIA_ZOOM } from "@/lib/rtoDirectory";

// High-performance Google Maps raster tile styles with pre-baked WebGL vector route layers.
// Pre-baking route and mesh sources directly inside the style specification guarantees
// that real-road trajectory lines render flawlessly without style-load race conditions.
const GOOGLE_GLYPHS = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";

const ROUTE_SOURCE_ID = "trajectory-route";
const MESH_LINKS_SOURCE_ID = "camera-mesh-links";

function createBasemapStyle(
  sourceKey: string,
  tiles: string[],
  layerKey: string,
): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      [sourceKey]: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution: "© Google Maps | City Surveillance Matrix",
      },
      [MESH_LINKS_SOURCE_ID]: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      [ROUTE_SOURCE_ID]: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      {
        id: layerKey,
        type: "raster",
        source: sourceKey,
        minzoom: 0,
        maxzoom: 22,
      },
      {
        id: "camera-mesh-layer",
        type: "line",
        source: MESH_LINKS_SOURCE_ID,
        paint: {
          "line-color": "#0284c7",
          "line-width": 1.5,
          "line-opacity": 0.35,
        },
      },
      {
        id: "trajectory-route-casing",
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#021533",
          "line-width": 12,
          "line-opacity": 0.95,
        },
      },
      {
        id: "trajectory-route-glow",
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#0284c7",
          "line-width": 7,
          "line-opacity": 1.0,
        },
      },
      {
        id: "trajectory-route-laser",
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#38bdf8",
          "line-width": 3,
          "line-opacity": 1.0,
        },
      },
    ],
    glyphs: GOOGLE_GLYPHS,
  };
}

const STREETS_STYLE = createBasemapStyle(
  "google-streets",
  [
    "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  ],
  "google-streets-layer",
);

const SATELLITE_STYLE = createBasemapStyle(
  "google-satellite",
  [
    "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  ],
  "google-satellite-layer",
);

const LIGHT_STYLE = createBasemapStyle(
  "google-terrain",
  [
    "https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    "https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    "https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
  ],
  "google-terrain-layer",
);

const BASEMAP_STYLES: Record<"light" | "streets" | "satellite", maplibregl.StyleSpecification> = {
  streets: STREETS_STYLE,
  satellite: SATELLITE_STYLE,
  light: LIGHT_STYLE,
};

interface InvestigationMapProps {
  cameras: CameraDto[];
  points: TrajectoryPointDto[];
  selectedIndex: number | null;
  onSelectPoint: (index: number) => void;
  replayToken: number;
  enteredPlate?: string;
  isConstructed?: boolean;
}

export function InvestigationMap({
  cameras,
  points,
  selectedIndex,
  onSelectPoint,
  replayToken,
  enteredPlate = "",
  isConstructed = false,
}: InvestigationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const cameraMarkersRef = useRef<maplibregl.Marker[]>([]);
  const checkpointElementsRef = useRef<{ el: HTMLDivElement; index: number }[]>([]);
  const isInitialReconstructRef = useRef<boolean>(true);
  const roadCoordinatesRef = useRef<[number, number][]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"light" | "streets" | "satellite">("streets");
  const [pitchMode, setPitchMode] = useState<"2D" | "3D" | "DRONE">("3D");
  const [hoveredCamera, setHoveredCamera] = useState<CameraDto | null>(null);

  const svgMeshRef = useRef<SVGPathElement | null>(null);
  const svgCasingRef = useRef<SVGPathElement | null>(null);
  const svgGlowRef = useRef<SVGPathElement | null>(null);
  const svgPathRef = useRef<SVGPathElement | null>(null);
  const updateSvgRouteRef = useRef<(() => void) | null>(null);

  // Active RTO area resolution from entered plate
  const activeArea = useMemo(() => resolveRtoArea(enteredPlate), [enteredPlate]);

  // Dynamically filter cameras:
  // 1. If not constructed and no plate entered: show NO cameras (clean whole India map)
  // 2. If not constructed and plate entered: show ONLY cameras near that RTO area
  // 3. If constructed: show cameras on trajectory and nearby
  const displayedCameras = useMemo(() => {
    if (!isConstructed && !enteredPlate.trim()) {
      return [];
    }
    if (activeArea) {
      const filtered = cameras.filter((c) => {
        if (activeArea.camIdPrefixes.some((p) => c.id.startsWith(p))) return true;
        const dLat = c.latitude - activeArea.center[1];
        const dLng = c.longitude - activeArea.center[0];
        return dLat * dLat + dLng * dLng < 0.30; // within vicinity
      });
      if (filtered.length > 0) return filtered;
    }
    if (isConstructed && points.length > 0) {
      const activeIds = new Set(points.map((p) => p.cameraId));
      const onRoute = cameras.filter((c) => activeIds.has(c.id));
      if (onRoute.length > 0) return onRoute;
    }
    if (enteredPlate.trim() && !isConstructed) {
      return cameras.slice(0, 12);
    }
    return cameras;
  }, [cameras, activeArea, enteredPlate, isConstructed, points]);

  // Dynamically resolve points coordinates against active cameras array
  // so that moving or updating any camera immediately updates trajectory points & route
  const effectivePoints = useMemo(() => {
    return points.map((p) => {
      const matchingCam = cameras.find((c) => c.id === p.cameraId);
      if (matchingCam) {
        return {
          ...p,
          latitude: matchingCam.latitude,
          longitude: matchingCam.longitude,
        };
      }
      return p;
    });
  }, [points, cameras]);

  // Initialize map with Whole Indian Map initially by default
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES[activeLayer],
      center: WHOLE_INDIA_CENTER, // Whole Indian Map initially
      zoom: WHOLE_INDIA_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    const onMapRenderOrMove = () => {
      updateSvgRouteRef.current?.();
    };

    map.on("render", onMapRenderOrMove);
    map.on("move", onMapRenderOrMove);
    map.on("zoom", onMapRenderOrMove);
    map.on("pitch", onMapRenderOrMove);
    map.on("rotate", onMapRenderOrMove);

    let isReadyFired = false;
    const markReady = () => {
      if (isReadyFired) return;
      isReadyFired = true;
      map.resize();
      setMapReady(true);
      updateSvgRouteRef.current?.();
    };

    map.on("load", markReady);
    map.on("style.load", markReady);
    map.on("styledata", markReady);
    map.on("error", (e) => {
      console.warn("MapLibre load note:", e);
      markReady();
    });

    const safetyTimer = setTimeout(markReady, 100);

    mapRef.current = map;
    if (typeof window !== "undefined") {
      (window as unknown as { __MAP__?: maplibregl.Map }).__MAP__ = map;
    }

    // ResizeObserver so map canvas redraws if the container size changes
    const ro = new ResizeObserver(() => {
      map.resize();
      updateSvgRouteRef.current?.();
    });
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      clearTimeout(safetyTimer);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle layer switch with proper styledata lifecycle in MapLibre
  const handleLayerSwitch = (styleKey: "light" | "streets" | "satellite") => {
    if (styleKey === activeLayer) return;
    isInitialReconstructRef.current = false;
    setActiveLayer(styleKey);
    setMapReady(false);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP_STYLES[styleKey]);

    const restoreRouteAndMesh = () => {
      if (!map.isStyleLoaded()) return;
      try {
        const currentWaypoints: [number, number][] = effectivePoints.map((p) => [p.longitude, p.latitude]);
        const validCoords =
          roadCoordinatesRef.current && roadCoordinatesRef.current.length >= 2
            ? roadCoordinatesRef.current
            : currentWaypoints;

        const initialData: GeoJSON.GeoJSON =
          validCoords.length >= 2
            ? {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: validCoords,
                    },
                    properties: {},
                  },
                ],
              }
            : {
                type: "FeatureCollection",
                features: [],
              };

        const setOrQueueInitialRoute = () => {
          const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
          if (source) {
            source.setData(initialData);
            return true;
          }
          if (map.isStyleLoaded()) {
            try {
              map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: initialData });
              if (!map.getLayer("trajectory-route-casing")) {
                map.addLayer({
                  id: "trajectory-route-casing",
                  type: "line",
                  source: ROUTE_SOURCE_ID,
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: { "line-color": "#021533", "line-width": 12, "line-opacity": 0.95 },
                });
              }
              if (!map.getLayer("trajectory-route-glow")) {
                map.addLayer({
                  id: "trajectory-route-glow",
                  type: "line",
                  source: ROUTE_SOURCE_ID,
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: { "line-color": "#0284c7", "line-width": 7, "line-opacity": 1.0 },
                });
              }
              if (!map.getLayer("trajectory-route-laser")) {
                map.addLayer({
                  id: "trajectory-route-laser",
                  type: "line",
                  source: ROUTE_SOURCE_ID,
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 1.0 },
                });
              }
              return true;
            } catch (err) {
              console.error("Error creating route source on demand:", err);
            }
          }
          return false;
        };

        if (!setOrQueueInitialRoute()) {
          map.once("styledata", () => setOrQueueInitialRoute());
          setTimeout(() => setOrQueueInitialRoute(), 200);
        }

        // Restore mesh links if available
        if (cameras.length > 0) {
          const meshFeatures: GeoJSON.Feature[] = [];
          for (let i = 0; i < cameras.length - 1; i++) {
            meshFeatures.push({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [cameras[i].longitude, cameras[i].latitude],
                  [cameras[i + 1].longitude, cameras[i + 1].latitude],
                ],
              },
              properties: {},
            });
          }
          const meshGeojson: GeoJSON.FeatureCollection = {
            type: "FeatureCollection",
            features: meshFeatures,
          };

          const meshSrc = map.getSource(MESH_LINKS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
          if (meshSrc) {
            meshSrc.setData(meshGeojson);
          } else {
            map.addSource(MESH_LINKS_SOURCE_ID, { type: "geojson", data: meshGeojson });
            if (!map.getLayer("camera-mesh-layer")) {
              map.addLayer({
                id: "camera-mesh-layer",
                type: "line",
                source: MESH_LINKS_SOURCE_ID,
                paint: {
                  "line-color": "#0284c7",
                  "line-width": 1.5,
                  "line-opacity": 0.35,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error("Error restoring route layers after style switch:", err);
      }
      map.resize();
      setMapReady(true);

      // Re-attach DOM markers to map after style swap
      markersRef.current.forEach((m) => m.addTo(map));
      cameraMarkersRef.current.forEach((m) => m.addTo(map));
    };

    const onStyleReady = () => {
      if (map.isStyleLoaded()) {
        map.off("styledata", onStyleReady);
        restoreRouteAndMesh();
      }
    };

    if (map.isStyleLoaded()) {
      restoreRouteAndMesh();
    } else {
      map.on("styledata", onStyleReady);
    }
  };

  const handlePitchPreset = (mode: "2D" | "3D" | "DRONE") => {
    const map = mapRef.current;
    if (!map) return;
    setPitchMode(mode);

    const targetPitch = mode === "2D" ? 0 : mode === "3D" ? 50 : 65;
    const targetBearing = mode === "2D" ? 0 : -18;

    map.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 900,
    });
  };

  // Render camera network mesh and tactical camera pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear old camera markers
    cameraMarkersRef.current.forEach((m) => m.remove());
    cameraMarkersRef.current = [];

    // If whole India overview (no plate entered and not constructed), show NO cameras
    if (!isConstructed && !enteredPlate.trim()) {
      const meshSrc = map.getSource(MESH_LINKS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (meshSrc) {
        meshSrc.setData({ type: "FeatureCollection", features: [] });
      }
      return;
    }

    if (displayedCameras.length === 0) return;

    // 1. Mesh links between adjacent cameras
    const meshFeatures: GeoJSON.Feature[] = [];
    for (let i = 0; i < displayedCameras.length - 1; i++) {
      meshFeatures.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [displayedCameras[i].longitude, displayedCameras[i].latitude],
            [displayedCameras[i + 1].longitude, displayedCameras[i + 1].latitude],
          ],
        },
        properties: {},
      });
    }

    const meshGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: meshFeatures,
    };

    const setOrQueueMesh = () => {
      const meshSrc = map.getSource(MESH_LINKS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (meshSrc) {
        meshSrc.setData(meshGeojson);
        return true;
      }
      if (map.isStyleLoaded()) {
        try {
          map.addSource(MESH_LINKS_SOURCE_ID, { type: "geojson", data: meshGeojson });
          if (!map.getLayer("camera-mesh-layer")) {
            map.addLayer({
              id: "camera-mesh-layer",
              type: "line",
              source: MESH_LINKS_SOURCE_ID,
              paint: {
                "line-color": "#0284c7",
                "line-width": 1.5,
                "line-opacity": 0.35,
              },
            });
          }
          return true;
        } catch (err) {
          console.error("FAILED TO ADD MESH LAYER:", err);
        }
      }
      return false;
    };

    if (!setOrQueueMesh()) {
      map.once("styledata", () => setOrQueueMesh());
      setTimeout(() => setOrQueueMesh(), 200);
    }

    // 2. Render sleek tactical CCTV camera pins for cameras NOT in active trajectory
    const activeCameraIds = isConstructed
      ? new Set(effectivePoints.map((p) => p.cameraId))
      : new Set<string>();

    displayedCameras.forEach((camera) => {
      if (activeCameraIds.has(camera.id)) return; // Checkpoint badge rendered separately

      const el = document.createElement("div");
      el.className = "cursor-pointer z-10 select-none";
      const statusColor =
        camera.status === "ONLINE"
          ? "bg-emerald-400 shadow-xs shadow-emerald-400/50"
          : camera.status === "PROCESSING"
            ? "bg-amber-400"
            : "bg-slate-400";

      el.innerHTML = `
        <div class="group flex flex-col items-center transform-gpu transition-transform duration-150 ease-out hover:scale-115">
          <div class="flex items-center gap-1.5 rounded-full border border-slate-700/90 bg-slate-950/95 px-2.5 py-1 text-[10px] font-mono font-black text-white shadow-md transition-colors group-hover:border-sky-400 group-hover:bg-slate-900 group-hover:shadow-sky-500/30">
            <span class="h-2 w-2 rounded-full ${statusColor}"></span>
            <span class="tracking-wider">${camera.id}</span>
          </div>
          <div class="h-1.5 w-0.5 bg-slate-800 shadow-sm mt-0.5"></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        setHoveredCamera((prev) => (prev?.id === camera.id ? prev : camera));
      });
      el.addEventListener("mouseleave", () => {
        setHoveredCamera((prev) => (prev?.id === camera.id ? null : prev));
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        setHoveredCamera(camera);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([camera.longitude, camera.latitude])
        .addTo(map);

      cameraMarkersRef.current.push(marker);
    });
  }, [displayedCameras, effectivePoints, isConstructed, enteredPlate, mapReady, activeLayer]);

  // Render trajectory route line along real roads and numbered checkpoint badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    checkpointElementsRef.current = [];

    if (!isConstructed || effectivePoints.length === 0) {
      roadCoordinatesRef.current = [];
      if (map.getSource(ROUTE_SOURCE_ID)) {
        (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
      if (svgGlowRef.current) svgGlowRef.current.setAttribute("d", "");
      if (svgPathRef.current) svgPathRef.current.setAttribute("d", "");
      return;
    }

    const rawWaypoints: [number, number][] = effectivePoints.map((p) => [p.longitude, p.latitude]);

    const updateSvg = () => {
      const map = mapRef.current;
      if (!map) return;

      const pathCoords =
        roadCoordinatesRef.current.length >= 2
          ? roadCoordinatesRef.current
          : rawWaypoints;

      if (pathCoords.length >= 2) {
        const pts = pathCoords.map(([lng, lat]) => map.project([lng, lat]));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", d);
        if (svgGlowRef.current) svgGlowRef.current.setAttribute("d", d);
        if (svgPathRef.current) svgPathRef.current.setAttribute("d", d);
      } else {
        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
        if (svgGlowRef.current) svgGlowRef.current.setAttribute("d", "");
        if (svgPathRef.current) svgPathRef.current.setAttribute("d", "");
      }

      if (cameras.length > 1 && svgMeshRef.current) {
        let meshD = "";
        for (let i = 0; i < cameras.length - 1; i++) {
          const p1 = map.project([cameras[i].longitude, cameras[i].latitude]);
          const p2 = map.project([cameras[i + 1].longitude, cameras[i + 1].latitude]);
          meshD += `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
        }
        svgMeshRef.current.setAttribute("d", meshD);
      }
    };

    updateSvgRouteRef.current = updateSvg;
    updateSvg();

    const applyRouteGeojson = (coordinates: [number, number][]) => {
      roadCoordinatesRef.current = coordinates;
      updateSvgRouteRef.current?.();
      if (coordinates.length < 2) return;
      const data: GeoJSON.GeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates,
            },
            properties: {},
          },
        ],
      };

      const setRouteData = () => {
        try {
          const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
          if (source) {
            source.setData(data);
          } else if (map.isStyleLoaded()) {
            map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data });
          }

          if (map.isStyleLoaded()) {
            if (!map.getLayer("trajectory-route-casing")) {
              map.addLayer({
                id: "trajectory-route-casing",
                type: "line",
                source: ROUTE_SOURCE_ID,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#021533", "line-width": 12, "line-opacity": 0.95 },
              });
            }
            if (!map.getLayer("trajectory-route-glow")) {
              map.addLayer({
                id: "trajectory-route-glow",
                type: "line",
                source: ROUTE_SOURCE_ID,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#0284c7", "line-width": 7, "line-opacity": 1.0 },
              });
            }
            if (!map.getLayer("trajectory-route-laser")) {
              map.addLayer({
                id: "trajectory-route-laser",
                type: "line",
                source: ROUTE_SOURCE_ID,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 1.0 },
              });
            }
          }
        } catch (err) {
          console.error("Error setting route data:", err);
        }
      };

      setRouteData();

      // If style is still loading, MapLibre will overwrite sources when it finishes.
      // Re-apply route data once style is fully ready.
      if (!map.isStyleLoaded()) {
        map.once("style.load", setRouteData);
        map.once("load", setRouteData);
        map.once("styledata", setRouteData);
      }
      setTimeout(setRouteData, 250);
      setTimeout(setRouteData, 600);
      setTimeout(setRouteData, 1200);
    };

    const cameraIds = effectivePoints.map((p) => p.cameraId);
    // Immediately render hardcoded route using camera coordinates and IDs
    const immediateRoute = getHardcodedRoute(rawWaypoints, cameraIds);
    applyRouteGeojson(immediateRoute);

    // Update with hardcoded road coordinates
    let isCancelled = false;
    fetchRoadRoute(rawWaypoints, cameraIds).then((roadCoords) => {
      if (isCancelled || !mapRef.current) return;
      applyRouteGeojson(roadCoords);
      updateSvgRouteRef.current?.();
    });

    // Numbered 3D floating checkpoint badges with camera name pills
    effectivePoints.forEach((point, index) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer z-20 select-none";

      el.innerHTML = `
        <div class="relative flex flex-col items-center justify-center transform-gpu transition-transform duration-150 ease-out hover:scale-110">
          <span class="radar-ping absolute -top-2 h-14 w-14 rounded-full bg-sky-400 opacity-60 animate-ping pointer-events-none hidden"></span>
          <div class="checkpoint-badge flex items-center gap-1.5 rounded-2xl border-2 border-white px-2.5 py-1 shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-700 to-sky-700 text-white shadow-blue-500/40">
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-900 font-mono text-xs font-black shadow-xs">
              ${index + 1}
            </span>
            <div class="flex flex-col text-left leading-none">
              <span class="font-mono text-[10px] font-black tracking-wider text-white">${point.cameraId}</span>
              <span class="text-[8px] font-bold text-sky-100 max-w-[85px] truncate">${point.cameraName.split(" - ")[0]}</span>
            </div>
          </div>
          <div class="h-2.5 w-1 bg-blue-700 shadow-sm mt-0.5 rounded-full"></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        isInitialReconstructRef.current = false;
        onSelectPoint(index);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);

      markersRef.current.push(marker);
      checkpointElementsRef.current.push({ el, index });
    });

    // Auto-fit bounds to encompass all checkpoints cleanly on initial target reconstruct
    if (isConstructed && effectivePoints.length > 1 && isInitialReconstructRef.current) {
      isInitialReconstructRef.current = false;
      const bounds = new maplibregl.LngLatBounds();
      effectivePoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 85, bottom: 85, left: 75, right: 75 },
        maxZoom: 13.2,
        duration: 700,
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [effectivePoints, displayedCameras, cameras, isConstructed, mapReady, activeLayer, onSelectPoint]);

  // Smooth camera navigation based on entered plate and construct state
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!isConstructed && !enteredPlate.trim()) {
      // Standby / whole India panoramic view
      map.easeTo({
        center: WHOLE_INDIA_CENTER,
        zoom: WHOLE_INDIA_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 900,
      });
    } else if (!isConstructed && enteredPlate.trim()) {
      // Area vicinity preview (user entered plate)
      const targetCenter = activeArea ? activeArea.center : [77.5284, 28.6788] as [number, number];
      const targetZoom = activeArea ? activeArea.zoom : 12.5;
      map.flyTo({
        center: targetCenter,
        zoom: targetZoom,
        pitch: 45,
        bearing: -15,
        duration: 1200,
      });
    } else if (isConstructed && effectivePoints.length > 1) {
      // Reconstructed route: auto-fit bounds
      const bounds = new maplibregl.LngLatBounds();
      effectivePoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 85, bottom: 85, left: 75, right: 75 },
        maxZoom: 13.5,
        duration: 1000,
      });
    }
  }, [isConstructed, enteredPlate, activeArea, effectivePoints, mapReady]);

  // Update checkpoint visual active state without re-creating DOM markers (zero jitter)
  useEffect(() => {
    checkpointElementsRef.current.forEach(({ el, index }) => {
      const isSelected = selectedIndex === index;
      const ping = el.querySelector(".radar-ping");
      const badge = el.querySelector(".checkpoint-badge");
      if (ping) {
        if (isSelected) {
          ping.classList.remove("hidden");
        } else {
          ping.classList.add("hidden");
        }
      }
      if (badge) {
        if (isSelected) {
          badge.className =
            "checkpoint-badge flex items-center gap-1.5 rounded-2xl border-2 border-white px-2.5 py-1 shadow-xl transition-all duration-200 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white scale-110 shadow-sky-500/50 ring-2 ring-sky-300";
        } else {
          badge.className =
            "checkpoint-badge flex items-center gap-1.5 rounded-2xl border-2 border-white px-2.5 py-1 shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-700 to-sky-700 text-white shadow-blue-500/40";
        }
      }
    });
  }, [selectedIndex]);

  // Pan to selected checkpoint smoothly on deliberate user interaction
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedIndex === null || !effectivePoints[selectedIndex]) return;
    if (isInitialReconstructRef.current) return;
    const target = effectivePoints[selectedIndex];
    map.easeTo({
      center: [target.longitude, target.latitude],
      duration: 500,
    });
  }, [selectedIndex, effectivePoints]);

  // 3D animated vehicle replay along trajectory
  useEffect(() => {
    if (replayToken === 0 || effectivePoints.length < 2) return;
    const map = mapRef.current;
    if (!map) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (!vehicleMarkerRef.current) {
      const el = document.createElement("div");
      el.innerHTML = `
        <div class="relative flex flex-col items-center justify-center">
          <span class="absolute -top-1 h-10 w-10 rounded-full bg-sky-400 animate-ping opacity-80"></span>
          <div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/50 font-bold text-base border-2 border-white">
            🚗
          </div>
        </div>
      `;
      vehicleMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([effectivePoints[0].longitude, effectivePoints[0].latitude])
        .addTo(map);
    }

    const durationMs = 5000;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      const pathCoords =
        roadCoordinatesRef.current.length > 1
          ? roadCoordinatesRef.current
          : effectivePoints.map((p) => [p.longitude, p.latitude] as [number, number]);

      const totalSegments = pathCoords.length - 1;
      const currentSegmentFloat = progress * totalSegments;
      const segmentIndex = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
      const segmentProgress = currentSegmentFloat - segmentIndex;

      const p1 = pathCoords[segmentIndex];
      const p2 = pathCoords[segmentIndex + 1];

      if (!p1 || !p2) {
        vehicleMarkerRef.current?.remove();
        vehicleMarkerRef.current = null;
        return;
      }

      const lng = p1[0] + (p2[0] - p1[0]) * segmentProgress;
      const lat = p1[1] + (p2[1] - p1[1]) * segmentProgress;

      vehicleMarkerRef.current?.setLngLat([lng, lat]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          vehicleMarkerRef.current?.remove();
          vehicleMarkerRef.current = null;
        }, 1200);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [replayToken, effectivePoints]);

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (isConstructed && effectivePoints.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      effectivePoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 85, bottom: 85, left: 75, right: 75 },
        maxZoom: 13.5,
        duration: 900,
      });
    } else if (activeArea && enteredPlate.trim()) {
      map.easeTo({
        center: activeArea.center,
        zoom: activeArea.zoom,
        pitch: pitchMode === "2D" ? 0 : pitchMode === "3D" ? 50 : 65,
        bearing: pitchMode === "2D" ? 0 : -18,
        duration: 900,
      });
    } else {
      map.easeTo({
        center: WHOLE_INDIA_CENTER,
        zoom: WHOLE_INDIA_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 900,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Dedicated Map Top Control Bar (Above Map Box / Section) */}
      <div className="flex items-center justify-between gap-3 rounded-lg border-1.5 border-slate-400 bg-white px-3.5 py-2">
        {/* Left: Dynamic Surveillance Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isConstructed
                ? "bg-emerald-600 animate-ping"
                : enteredPlate.trim()
                  ? "bg-amber-500 animate-pulse"
                  : "bg-slate-500"
            }`}
          />
          <div className="flex items-center gap-1.5 font-mono leading-none">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-950">
              {isConstructed
                ? `⚡ ${activeArea?.city.toUpperCase() ?? "TARGET"} 3D CORRIDOR`
                : enteredPlate.trim()
                  ? `📍 ${activeArea?.code ?? "RTO"} ${activeArea?.city.toUpperCase() ?? "AREA"} VICINITY`
                  : "🇮🇳 ALL-INDIA SURVEILLANCE GRID"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold">
              {isConstructed
                ? `${effectivePoints.length} CHECKPOINTS`
                : enteredPlate.trim()
                  ? `${displayedCameras.length} CAMERAS IN VICINITY`
                  : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Right: Map Layers, 3D Tilt Presets & Fit */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Basemap Styles */}
          <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => handleLayerSwitch("streets")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === "streets"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => handleLayerSwitch("satellite")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === "satellite"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleLayerSwitch("light")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === "light"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              Canvas
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* 3D Angle Presets */}
          <div className="flex items-center gap-0.5 rounded-md border border-slate-300 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => handlePitchPreset("2D")}
              title="2D Top-Down View"
              className={`rounded px-2 py-1 text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                pitchMode === "2D"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => handlePitchPreset("3D")}
              title="3D Isometric 50° View"
              className={`rounded px-2 py-1 text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                pitchMode === "3D"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              3D Iso
            </button>
            <button
              type="button"
              onClick={() => handlePitchPreset("DRONE")}
              title="3D Drone Angle 65° View"
              className={`rounded px-2 py-1 text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                pitchMode === "DRONE"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-800 hover:bg-slate-200/70"
              }`}
            >
              Drone
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          <button
            type="button"
            onClick={handleResetView}
            title="Reset or Fit View"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
          >
            🎯 Fit
          </button>
        </div>
      </div>

      {/* Main Map Box / Square Section */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border-1.5 border-slate-400 bg-slate-100"
        style={{ height: "560px" }}
      >
        {/* Tactical Status Banner Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 z-30 select-none max-w-[85%]">
          {!isConstructed && !enteredPlate.trim() ? (
            <div className="rounded-md border border-slate-600 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-slate-200 shadow-xl flex items-center gap-2">
              <span className="text-sm">🇮🇳</span>
              <div>
                <span className="font-bold text-sky-400">All-India Panoramic Grid:</span>{" "}
                <span>Enter vehicle plate to focus vicinity cameras, or ingest video to generate trajectory.</span>
              </div>
            </div>
          ) : !isConstructed && enteredPlate.trim() ? (
            <div className="rounded-md border border-amber-500 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-amber-100 shadow-xl flex items-center gap-2">
              <span className="text-sm">📍</span>
              <div>
                <span className="font-bold text-amber-400">
                  {activeArea ? `${activeArea.code} (${activeArea.city})` : "Area"} Vicinity Focused:
                </span>{" "}
                <span>{displayedCameras.length} CCTV cameras in range. Click <strong className="text-white underline">⚡ Reconstruct 3D Trajectory</strong> or <strong className="text-white underline">📹 Ingest Video</strong> to build route.</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-500 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-emerald-100 shadow-xl flex items-center gap-2">
              <span className="text-sm">🛰️</span>
              <div>
                <span className="font-bold text-emerald-400">Trajectory Route Reconstructed:</span>{" "}
                <span>3D route linked across {effectivePoints.length} camera checkpoints.</span>
              </div>
            </div>
          )}
        </div>

        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 z-10 h-3.5 w-3.5 border-t-2 border-l-2 border-slate-600" />
        <div className="pointer-events-none absolute top-2 right-2 z-10 h-3.5 w-3.5 border-t-2 border-r-2 border-slate-600" />
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 h-3.5 w-3.5 border-b-2 border-l-2 border-slate-600" />
        <div className="pointer-events-none absolute bottom-2 right-2 z-10 h-3.5 w-3.5 border-b-2 border-r-2 border-slate-600" />

        {/* Real-time Google Maps Navigation Route SVG Overlay */}
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          <defs>
            <filter id="route-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.75" />
            </filter>
          </defs>
          {/* Camera network mesh links */}
          <path
            ref={svgMeshRef}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
          {/* Trajectory Route - Deep Navy Casing */}
          <path
            ref={svgCasingRef}
            fill="none"
            stroke="#021533"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.9"
          />
          {/* Trajectory Route - Vibrant Google Navigation Blue */}
          <path
            ref={svgGlowRef}
            fill="none"
            stroke="#2563eb"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="1"
            filter="url(#route-glow-filter)"
          />
          {/* Trajectory Route - Laser Cyan Core */}
          <path
            ref={svgPathRef}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="1"
          />
        </svg>

        {/* 3D Camera Hover Telemetry Card */}
        {hoveredCamera && (
          <div className="pointer-events-none absolute bottom-5 left-5 z-20 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <span className="font-mono text-xs font-black text-slate-900">{hoveredCamera.id}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {hoveredCamera.status}
              </span>
            </div>

            <div className="mt-2 text-xs font-bold text-slate-800">{hoveredCamera.name}</div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div>Facing: <span className="text-sky-700 font-bold">{hoveredCamera.direction}</span></div>
              <div>Optical: <span className="text-slate-800 font-semibold">4K UHD</span></div>
              <div>Lat: <span className="text-slate-700">{hoveredCamera.latitude.toFixed(4)}</span></div>
              <div>Lng: <span className="text-slate-700">{hoveredCamera.longitude.toFixed(4)}</span></div>
            </div>
          </div>
        )}

        {/* Route Checkpoints Detected Badge */}
        {isConstructed && points.length > 0 && (
          <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2.5 rounded-md border-1.5 border-slate-400 bg-white px-3.5 py-2 text-xs font-mono text-slate-900">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-bold text-slate-900">{points.length} Checkpoints Connected</span>
          </div>
        )}
      </div>
    </div>
  );
}
