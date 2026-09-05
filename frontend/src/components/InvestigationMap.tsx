"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CameraDto, TrajectoryPointDto } from "@/lib/api";

// Free, no-API-key dark basemap (CARTO's dark_all raster tiles over OSM data).
// Swap for Mapbox GL JS + a real token later if the deployment has one -
// this component's public surface (props) doesn't need to change.
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "carto-dark-layer", type: "raster", source: "carto-dark", minzoom: 0, maxzoom: 20 }],
};

const ROUTE_SOURCE_ID = "trajectory-route";
const ROUTE_LAYER_ID = "trajectory-route-line";
const POINTS_SOURCE_ID = "trajectory-points";
const CAMERAS_SOURCE_ID = "all-cameras";

interface InvestigationMapProps {
  cameras: CameraDto[];
  points: TrajectoryPointDto[];
  selectedIndex: number | null;
  onSelectPoint: (index: number) => void;
  replayToken: number; // bump this to trigger a replay animation
}

function statusColor(status: string): string {
  if (status === "ONLINE") return "#34d399";
  if (status === "PROCESSING") return "#fbbf24";
  return "#71717a";
}

export function InvestigationMap({ cameras, points, selectedIndex, onSelectPoint, replayToken }: InvestigationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [73.85, 18.52],
      zoom: 11.5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // "load" only needs the style spec to be parsed, not the basemap tiles
    // to finish downloading - but a slow/unreachable tile provider (corporate
    // network, ad-blocker, CDN outage) can still delay it well past what a
    // user will wait. The camera network and route are the actual
    // investigation data, not the basemap, so don't let them stay hidden
    // behind a struggling tile provider.
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      setMapReady(true);
    };
    map.on("style.load", markReady); // style + sources ready for addSource/addLayer, doesn't wait on basemap tiles
    map.on("load", markReady);
    const fallbackTimer = window.setTimeout(markReady, 2500);
    mapRef.current = map;

    return () => {
      window.clearTimeout(fallbackTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // All-camera network layer (small dots), drawn once the map + camera list are ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || cameras.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: cameras.map((camera) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [camera.longitude, camera.latitude] },
        properties: { id: camera.id, name: camera.name, status: camera.status },
      })),
    };

    if (map.getSource(CAMERAS_SOURCE_ID)) {
      (map.getSource(CAMERAS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(CAMERAS_SOURCE_ID, { type: "geojson", data: geojson });
      map.addLayer({
        id: "all-cameras-layer",
        type: "circle",
        source: CAMERAS_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "match",
            ["get", "status"],
            "ONLINE", statusColor("ONLINE"),
            "PROCESSING", statusColor("PROCESSING"),
            statusColor("OFFLINE"),
          ],
          "circle-opacity": 0.55,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#18181b",
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      map.on("mouseenter", "all-cameras-layer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        popup
          .setLngLat(coords)
          .setHTML(`<div style="font:12px system-ui;color:#111">${f.properties?.name} (${f.properties?.id})</div>`)
          .addTo(map);
      });
      map.on("mouseleave", "all-cameras-layer", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    }
  }, [cameras, mapReady]);

  // Trajectory route + numbered points.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const lineGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: points.map((p) => [p.longitude, p.latitude]) },
      properties: {},
    };
    const pointsGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p, i) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
        properties: { index: i, cameraId: p.cameraId, cameraName: p.cameraName },
      })),
    };

    if (map.getSource(ROUTE_SOURCE_ID)) {
      (map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(lineGeojson);
      (map.getSource(POINTS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(pointsGeojson);
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: lineGeojson });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 0.85 },
      });

      map.addSource(POINTS_SOURCE_ID, { type: "geojson", data: pointsGeojson });
      map.addLayer({
        id: "trajectory-points-halo",
        type: "circle",
        source: POINTS_SOURCE_ID,
        paint: { "circle-radius": 10, "circle-color": "#38bdf8", "circle-opacity": 0.2 },
      });
      map.addLayer({
        id: "trajectory-points-layer",
        type: "circle",
        source: POINTS_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": "#0ea5e9",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#e0f2fe",
        },
      });
      map.addLayer({
        id: "trajectory-points-label",
        type: "symbol",
        source: POINTS_SOURCE_ID,
        layout: {
          "text-field": ["to-string", ["+", ["get", "index"], 1]],
          "text-size": 10,
          "text-font": ["Noto Sans Bold"],
        },
        paint: { "text-color": "#0c4a6e" },
      });

      map.on("click", "trajectory-points-layer", (e) => {
        const f = e.features?.[0];
        if (f && typeof f.properties?.index === "number") {
          onSelectPoint(f.properties.index);
        }
      });
      map.on("mouseenter", "trajectory-points-layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "trajectory-points-layer", () => (map.getCanvas().style.cursor = ""));
    }

    if (points.length > 0) {
      const bounds = points.reduce(
        (b, p) => b.extend([p.longitude, p.latitude]),
        new maplibregl.LngLatBounds([points[0].longitude, points[0].latitude], [points[0].longitude, points[0].latitude]),
      );
      map.fitBounds(bounds as LngLatBoundsLike, { padding: 80, maxZoom: 14, duration: 800 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, mapReady]);

  // Fly to & highlight the selected point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || selectedIndex === null) return;
    const point = points[selectedIndex];
    if (!point) return;
    map.flyTo({ center: [point.longitude, point.latitude], zoom: 14.5, duration: 900 });
  }, [selectedIndex, points, mapReady]);

  // Replay animation: move a marker along the route, pacing each hop by its real elapsed time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || points.length < 2 || replayToken === 0) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (!vehicleMarkerRef.current) {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = "#f97316";
      el.style.boxShadow = "0 0 0 4px rgba(249,115,22,0.35), 0 0 10px rgba(249,115,22,0.8)";
      vehicleMarkerRef.current = new maplibregl.Marker({ element: el });
    }
    const marker = vehicleMarkerRef.current;
    marker.setLngLat([points[0].longitude, points[0].latitude]).addTo(map);

    const segments = points.slice(1).map((p, i) => {
      const from = points[i];
      const realMs = Math.max(1000, new Date(p.timestamp).getTime() - new Date(from.timestamp).getTime());
      return { from, to: p, weight: realMs };
    });
    const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
    const TOTAL_ANIMATION_MS = 6000;

    let segmentIndex = 0;
    let segmentStart = performance.now();

    function step(now: number) {
      if (segmentIndex >= segments.length) return;
      const seg = segments[segmentIndex];
      const segmentDurationMs = Math.max(400, (seg.weight / totalWeight) * TOTAL_ANIMATION_MS);
      const t = Math.min(1, (now - segmentStart) / segmentDurationMs);
      const lng = seg.from.longitude + (seg.to.longitude - seg.from.longitude) * t;
      const lat = seg.from.latitude + (seg.to.latitude - seg.from.latitude) * t;
      marker.setLngLat([lng, lat]);

      if (t >= 1) {
        segmentIndex += 1;
        segmentStart = now;
        onSelectPoint(segmentIndex);
        if (segmentIndex >= segments.length) return;
      }
      animationFrameRef.current = requestAnimationFrame(step);
    }
    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayToken, mapReady]);

  return <div ref={containerRef} className="h-full w-full" />;
}
