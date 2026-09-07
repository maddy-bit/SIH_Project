"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
// NOTE: MapLibre CSS is imported in globals.css (not here) to avoid
// lightningcss native-binding crash on Linux CI runners.
import type { CameraDto, TrajectoryPointDto } from "@/lib/api";

// High-performance Google Maps raster tile styles.
// Bypasses vector tile decoder issues in privacy browsers (e.g. Brave Shields)
// and delivers full street grids, highway markers, terrain, and satellite imagery.
const GOOGLE_GLYPHS = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";

const GOOGLE_STREETS_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "google-streets": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
      attribution: "© Google Maps | City AI Surveillance Matrix",
    },
  },
  layers: [
    {
      id: "google-streets-layer",
      type: "raster",
      source: "google-streets",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  glyphs: GOOGLE_GLYPHS,
};

const GOOGLE_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "google-satellite": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
      attribution: "© Google Maps | City AI Surveillance Matrix",
    },
  },
  layers: [
    {
      id: "google-satellite-layer",
      type: "raster",
      source: "google-satellite",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  glyphs: GOOGLE_GLYPHS,
};

const GOOGLE_TERRAIN_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "google-terrain": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
      attribution: "© Google Maps | City AI Surveillance Matrix",
    },
  },
  layers: [
    {
      id: "google-terrain-layer",
      type: "raster",
      source: "google-terrain",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  glyphs: GOOGLE_GLYPHS,
};

const BASEMAP_STYLES: Record<"light" | "streets" | "satellite", maplibregl.StyleSpecification> = {
  streets: GOOGLE_STREETS_STYLE,
  satellite: GOOGLE_SATELLITE_STYLE,
  light: GOOGLE_TERRAIN_STYLE,
};

const ROUTE_SOURCE_ID = "trajectory-route";
const ROUTE_LAYER_ID = "trajectory-route-line";
const MESH_LINKS_SOURCE_ID = "camera-mesh-links";

interface InvestigationMapProps {
  cameras: CameraDto[];
  points: TrajectoryPointDto[];
  selectedIndex: number | null;
  onSelectPoint: (index: number) => void;
  replayToken: number;
}

export function InvestigationMap({
  cameras,
  points,
  selectedIndex,
  onSelectPoint,
  replayToken,
}: InvestigationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"light" | "streets" | "satellite">("streets");
  const [hoveredCamera, setHoveredCamera] = useState<CameraDto | null>(null);

  // Initialize map with Maptiler vector tiles
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES[activeLayer],
      center: [73.8350, 18.5350], // Pune City Camera Network
      zoom: 12.5,
      pitch: 50,   // 3D Isometric View by default
      bearing: -18,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    const markReady = () => {
      map.resize();
      setMapReady(true);
    };

    map.on("load", markReady);
    const onInitialStyle = () => {
      if (map.isStyleLoaded()) {
        map.off("styledata", onInitialStyle);
        markReady();
      }
    };
    map.on("styledata", onInitialStyle);

    mapRef.current = map;
    if (typeof window !== "undefined") {
      (window as unknown as { __MAP__?: maplibregl.Map }).__MAP__ = map;
    }

    // ResizeObserver so map canvas redraws if the container size changes
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle layer switch with proper styledata lifecycle in MapLibre
  const handleLayerSwitch = (styleKey: "light" | "streets" | "satellite") => {
    setActiveLayer(styleKey);
    setMapReady(false);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP_STYLES[styleKey]);
    
    const onStyleReady = () => {
      if (map.isStyleLoaded()) {
        map.off("styledata", onStyleReady);
        map.resize();
        setMapReady(true);
      }
    };
    map.on("styledata", onStyleReady);
  };

  // 3D Pitch presets
  const [pitchMode, setPitchMode] = useState<"2D" | "3D" | "DRONE">("3D");
  const [is3D, setIs3D] = useState(true);

  const handlePitchPreset = (mode: "2D" | "3D" | "DRONE") => {
    const map = mapRef.current;
    if (!map) return;
    setPitchMode(mode);
    setIs3D(mode !== "2D");

    const targetPitch = mode === "2D" ? 0 : mode === "3D" ? 50 : 65;
    const targetBearing = mode === "2D" ? 0 : -18;

    map.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 900,
    });
  };

  const cameraMarkersRef = useRef<maplibregl.Marker[]>([]);
  const checkpointElementsRef = useRef<{ el: HTMLElement; index: number }[]>([]);
  const svgPathCasingRef = useRef<SVGPathElement | null>(null);
  const svgPathGlowRef = useRef<SVGPathElement | null>(null);
  const svgPathLaserRef = useRef<SVGPathElement | null>(null);
  const isInitialReconstructRef = useRef<boolean>(true);

  // Sync SVG trajectory line overlay with MapLibre camera movements without React re-renders
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const updateSvgTrajectory = () => {
      if (!mapRef.current || points.length < 2) {
        svgPathCasingRef.current?.setAttribute("d", "");
        svgPathGlowRef.current?.setAttribute("d", "");
        svgPathLaserRef.current?.setAttribute("d", "");
        return;
      }
      const d = points
        .map((pt, i) => {
          const ptPos = mapRef.current?.project([pt.longitude, pt.latitude]);
          if (!ptPos) return "";
          return `${i === 0 ? "M" : "L"} ${ptPos.x.toFixed(1)} ${ptPos.y.toFixed(1)}`;
        })
        .join(" ");
      svgPathCasingRef.current?.setAttribute("d", d);
      svgPathGlowRef.current?.setAttribute("d", d);
      svgPathLaserRef.current?.setAttribute("d", d);
    };

    updateSvgTrajectory();
    map.on("move", updateSvgTrajectory);
    map.on("render", updateSvgTrajectory);

    return () => {
      map.off("move", updateSvgTrajectory);
      map.off("render", updateSvgTrajectory);
    };
  }, [points, mapReady]);

  // Render camera network mesh and tactical camera pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || cameras.length === 0) return;

    // Clear old camera markers
    cameraMarkersRef.current.forEach((m) => m.remove());
    cameraMarkersRef.current = [];

    // 1. Mesh links between adjacent cameras
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

    try {
      if (map.getSource(MESH_LINKS_SOURCE_ID)) {
        (map.getSource(MESH_LINKS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(meshGeojson);
      } else {
        map.addSource(MESH_LINKS_SOURCE_ID, { type: "geojson", data: meshGeojson });
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
    } catch {
      // Mesh layer fallback
    }

    // 2. Render sleek tactical CCTV camera pins for cameras NOT in active trajectory
    const activeCameraIds = new Set(points.map((p) => p.cameraId));

    cameras.forEach((camera) => {
      if (activeCameraIds.has(camera.id)) return; // Checkpoint badge rendered separately

      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform hover:scale-125 z-10 select-none";
      const statusColor =
        camera.status === "ONLINE"
          ? "bg-emerald-400 animate-pulse"
          : camera.status === "PROCESSING"
            ? "bg-amber-400"
            : "bg-slate-400";

      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-1.5 rounded-full border border-slate-700/90 bg-slate-950/90 px-2.5 py-1 text-[10px] font-mono font-black text-white shadow-md backdrop-blur-md transition-colors hover:border-sky-400 hover:bg-slate-900">
            <span class="h-2 w-2 rounded-full ${statusColor}"></span>
            <span class="tracking-wider">${camera.id}</span>
          </div>
          <div class="h-1.5 w-0.5 bg-slate-800 shadow-sm mt-0.5"></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => setHoveredCamera(camera));
      el.addEventListener("mouseleave", () => setHoveredCamera(null));
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
  }, [cameras, points, mapReady, activeLayer]);

  // Render trajectory route line and numbered checkpoint badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    checkpointElementsRef.current = [];

    if (points.length === 0) {
      if (map.getSource(ROUTE_SOURCE_ID)) {
        (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      return;
    }

    const coordinates = points.map((p) => [p.longitude, p.latitude]);

    const routeGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates },
          properties: {},
        },
      ],
    };

    try {
      if (map.getSource(ROUTE_SOURCE_ID)) {
        (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(routeGeojson);
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: routeGeojson });

        if (!map.getLayer("trajectory-route-casing")) {
          map.addLayer({
            id: "trajectory-route-casing",
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#091e42", "line-width": 8, "line-opacity": 0.85 },
          });
        }

        if (!map.getLayer(ROUTE_LAYER_ID)) {
          map.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#0284c7", "line-width": 5, "line-opacity": 0.95 },
          });
        }

        if (!map.getLayer("trajectory-route-laser")) {
          map.addLayer({
            id: "trajectory-route-laser",
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": 1.0 },
          });
        }
      }
    } catch {
      // MapLibre WebGL layer fallback
    }

    // Numbered 3D floating checkpoint badges with camera name pills
    points.forEach((point, index) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform hover:scale-125 z-20 select-none";

      el.innerHTML = `
        <div class="relative flex flex-col items-center justify-center">
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

    // Auto-fit bounds to encompass all checkpoints cleanly across Pune on points change
    if (points.length > 1) {
      isInitialReconstructRef.current = true;
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 85, bottom: 85, left: 75, right: 75 },
        maxZoom: 13.2,
        duration: 900,
      });
    }
  }, [points, mapReady, activeLayer, onSelectPoint]);

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
    if (!map || selectedIndex === null || !points[selectedIndex]) return;
    if (isInitialReconstructRef.current) return;
    const target = points[selectedIndex];
    map.easeTo({
      center: [target.longitude, target.latitude],
      duration: 500,
    });
  }, [selectedIndex, points]);

  // 3D animated vehicle replay along trajectory
  useEffect(() => {
    if (replayToken === 0 || points.length < 2) return;
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
        .setLngLat([points[0].longitude, points[0].latitude])
        .addTo(map);
    }

    const durationMs = 5000;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      const totalSegments = points.length - 1;
      const currentSegmentFloat = progress * totalSegments;
      const segmentIndex = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
      const segmentProgress = currentSegmentFloat - segmentIndex;

      const p1 = points[segmentIndex];
      const p2 = points[segmentIndex + 1];

      if (!p1 || !p2) {
        vehicleMarkerRef.current?.remove();
        vehicleMarkerRef.current = null;
        return;
      }

      const lng = p1.longitude + (p2.longitude - p1.longitude) * segmentProgress;
      const lat = p1.latitude + (p2.latitude - p1.latitude) * segmentProgress;

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
  }, [replayToken, points]);

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 65, duration: 800 });
    } else {
      map.flyTo({ center: [73.8350, 18.5350], zoom: 12.5, pitch: is3D ? 50 : 0, bearing: is3D ? -18 : 0, duration: 800 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-3xl border border-slate-300/80 bg-slate-100 shadow-xl"
      style={{ height: "560px" }}
    >
      {/* Tactical HUD Corner Reticles */}
      <div className="pointer-events-none absolute top-2 left-2 z-10 h-3.5 w-3.5 border-t-2 border-l-2 border-sky-500" />
      <div className="pointer-events-none absolute top-2 right-2 z-10 h-3.5 w-3.5 border-t-2 border-r-2 border-sky-500" />
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 h-3.5 w-3.5 border-b-2 border-l-2 border-sky-500" />
      <div className="pointer-events-none absolute bottom-2 right-2 z-10 h-3.5 w-3.5 border-b-2 border-r-2 border-sky-500" />

        <svg className="pointer-events-none absolute inset-0 h-full w-full z-[5] overflow-visible">
          <defs>
            <filter id="route-glow-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Deep Navy Casing for maximum contrast against any terrain/satellite/roads */}
          <path
            ref={svgPathCasingRef}
            d=""
            fill="none"
            stroke="#091e42"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* Electric Neon Sky Blue Trajectory Line */}
          <path
            ref={svgPathGlowRef}
            d=""
            fill="none"
            stroke="#0284c7"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#route-glow-blur)"
          />
          {/* Glowing Center Laser Core */}
          <path
            ref={svgPathLaserRef}
            d=""
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

      {/* Layer Controls & 3D Tilt (Top Right) */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 backdrop-blur-xl shadow-md">
        <button
          type="button"
          onClick={() => handleLayerSwitch("streets")}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
            activeLayer === "streets"
              ? "bg-sky-50 text-sky-700 border border-sky-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => handleLayerSwitch("satellite")}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
            activeLayer === "satellite"
              ? "bg-sky-50 text-sky-700 border border-sky-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => handleLayerSwitch("light")}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
            activeLayer === "light"
              ? "bg-sky-50 text-sky-700 border border-sky-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Canvas
        </button>

        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        {/* 3D Angle Presets */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handlePitchPreset("2D")}
            title="2D Top-Down View"
            className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer ${
              pitchMode === "2D"
                ? "bg-sky-100 text-sky-800 border border-sky-300 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => handlePitchPreset("3D")}
            title="3D Isometric 50° View"
            className={`rounded-lg px-2 py-1 text-[11px] font-mono font-black transition-all cursor-pointer ${
              pitchMode === "3D"
                ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3D Iso
          </button>
          <button
            type="button"
            onClick={() => handlePitchPreset("DRONE")}
            title="3D Drone Angle 65° View"
            className={`rounded-lg px-2 py-1 text-[11px] font-mono font-black transition-all cursor-pointer ${
              pitchMode === "DRONE"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Drone
          </button>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={handleResetView}
          title="Fit Route to Bounds"
          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
        >
          🎯 Fit
        </button>
      </div>

      {/* 3D Smart City Mesh Badge (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 backdrop-blur-xl shadow-xs">
        <span className="flex h-2 w-2 rounded-full bg-sky-500 shadow-xs animate-pulse" />
        <div className="flex items-center gap-1.5 font-mono leading-none">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-900">
            PUNE 3D MESH
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
            {cameras.length} NODES
          </span>
        </div>
      </div>

      {/* 3D Camera Hover Telemetry Card */}
      {hoveredCamera && (
        <div className="absolute bottom-5 left-5 z-20 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur-2xl shadow-xl">
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
      {points.length > 0 && (
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-xl text-xs font-mono text-slate-800 shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-ping" />
          <span className="font-extrabold text-sky-700">{points.length} Checkpoints Connected</span>
        </div>
      )}
    </div>
  );
}
