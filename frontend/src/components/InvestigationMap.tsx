"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
// NOTE: MapLibre CSS is imported in globals.css (not here) to avoid
// lightningcss native-binding crash on Linux CI runners.
import type { CameraDto, TrajectoryPointDto } from "@/lib/api";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "YNlAc2R6pThUIZrd2o5m";

// Maptiler vector tile style URLs — these include glyphs, sprites, and
// proper font PBFs so camera labels render correctly with no extra config.
const BASEMAP_STYLES: Record<"light" | "streets" | "satellite", string> = {
  streets:   `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  light:     `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`,
};

const ROUTE_SOURCE_ID = "trajectory-route";
const ROUTE_LAYER_ID = "trajectory-route-line";
const ROUTE_GLOW_LAYER_ID = "trajectory-route-glow";
const CAMERAS_SOURCE_ID = "all-cameras";
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

    const markReady = () => setMapReady(true);

    map.on("load", () => {
      map.resize(); // ensure canvas matches container size after dynamic load
      markReady();
    });
    map.on("style.load", markReady);

    mapRef.current = map;

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

  // Handle layer switch
  const handleLayerSwitch = (styleKey: "light" | "streets" | "satellite") => {
    setActiveLayer(styleKey);
    setMapReady(false);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP_STYLES[styleKey]);
    map.once("style.load", () => {
      setMapReady(true);
    });
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

  // Render camera network mesh and nodes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || cameras.length === 0) return;

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

    if (map.getSource(MESH_LINKS_SOURCE_ID)) {
      (map.getSource(MESH_LINKS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(meshGeojson);
    } else {
      map.addSource(MESH_LINKS_SOURCE_ID, { type: "geojson", data: meshGeojson });
      map.addLayer({
        id: "camera-mesh-layer",
        type: "line",
        source: MESH_LINKS_SOURCE_ID,
        paint: {
          "line-color": "rgba(2, 132, 199, 0.35)",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
        },
      });
    }

    // 2. Camera node GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: cameras.map((camera) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [camera.longitude, camera.latitude],
        },
        properties: {
          id: camera.id,
          name: camera.name,
          status: camera.status,
          direction: camera.direction,
        },
      })),
    };

    if (map.getSource(CAMERAS_SOURCE_ID)) {
      (map.getSource(CAMERAS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(CAMERAS_SOURCE_ID, { type: "geojson", data: geojson });

      // Radar Pulse Rings
      map.addLayer({
        id: "all-cameras-glow",
        type: "circle",
        source: CAMERAS_SOURCE_ID,
        paint: {
          "circle-radius": 15,
          "circle-color": [
            "match",
            ["get", "status"],
            "ONLINE",    "rgba(16, 185, 129, 0.25)",
            "PROCESSING","rgba(245, 158, 11, 0.3)",
            "rgba(148, 163, 184, 0.2)",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(2, 132, 199, 0.5)",
        },
      });

      // Core Camera Point
      map.addLayer({
        id: "all-cameras-core",
        type: "circle",
        source: CAMERAS_SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "status"],
            "ONLINE",    "#059669",
            "PROCESSING","#d97706",
            "#64748b",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Camera ID Labels (glyphs come from Maptiler's style JSON)
      map.addLayer({
        id: "all-cameras-labels",
        type: "symbol",
        source: CAMERAS_SOURCE_ID,
        layout: {
          "text-field": ["get", "id"],
          "text-size": 11,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-font": ["Open Sans Bold"],
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
        },
      });

      map.on("mouseenter", "all-cameras-core", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const matched = cameras.find((c) => c.id === props.id);
          if (matched) setHoveredCamera(matched);
        }
      });

      map.on("mouseleave", "all-cameras-core", () => {
        map.getCanvas().style.cursor = "";
        setHoveredCamera(null);
      });
    }
  }, [cameras, mapReady, activeLayer]);

  // Render trajectory polyline and numbered checkpoint markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

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

    if (map.getSource(ROUTE_SOURCE_ID)) {
      (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(routeGeojson);
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: routeGeojson });

      map.addLayer({
        id: ROUTE_GLOW_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0284c7", "line-width": 12, "line-opacity": 0.3 },
      });

      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0284c7", "line-width": 5 },
      });
    }

    // Numbered 3D floating checkpoint badges
    points.forEach((point, index) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform hover:scale-125";
      const isSelected = selectedIndex === index;

      el.innerHTML = `
        <div class="relative flex flex-col items-center justify-center">
          ${isSelected ? '<span class="absolute -top-1 h-12 w-12 rounded-full bg-sky-400 opacity-60 animate-ping"></span>' : ""}
          <div class="flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-white ${
            isSelected
              ? "bg-gradient-to-tr from-sky-600 to-blue-600 text-white shadow-xl shadow-sky-500/50 scale-110"
              : "bg-blue-600 text-white shadow-md shadow-blue-500/30"
          } font-mono text-sm font-black">
            ${index + 1}
          </div>
          <div class="h-2 w-0.5 bg-blue-600 shadow-sm mt-0.5"></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPoint(index);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 75, maxZoom: 14.5, duration: 1000 });
    }
  }, [points, selectedIndex, mapReady, activeLayer, onSelectPoint]);

  // Pan to selected checkpoint
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedIndex === null || !points[selectedIndex]) return;
    const target = points[selectedIndex];
    map.easeTo({
      center: [target.longitude, target.latitude],
      zoom: Math.max(map.getZoom(), 13.5),
      duration: 800,
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
