"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface VehicleHologram3DProps {
  plate?: string;
  vehicleType?: string | null;
  color?: string | null;
  className?: string;
}

// 3D wireframe vertices for a vehicle (SUV / Sedan chassis)
// Represented as [x, y, z] in normalized coordinates
const BASE_VERTICES: [number, number, number][] = [
  // Bottom chassis perimeter
  [-1.6, -0.4, -0.9], // 0: rear left bottom
  [1.6, -0.4, -0.9],  // 1: front left bottom
  [1.6, -0.4, 0.9],   // 2: front right bottom
  [-1.6, -0.4, 0.9],  // 3: rear right bottom

  // Waistline / hood level
  [-1.6, 0.1, -0.9],  // 4: rear left belt
  [0.6, 0.1, -0.9],   // 5: cowl left
  [1.6, 0.05, -0.85], // 6: nose left
  [1.6, 0.05, 0.85],  // 7: nose right
  [0.6, 0.1, 0.9],    // 8: cowl right
  [-1.6, 0.1, 0.9],   // 9: rear right belt

  // Roof perimeter
  [-1.2, 0.85, -0.7], // 10: rear left roof
  [0.3, 0.85, -0.7],  // 11: front left roof (windshield top)
  [0.3, 0.85, 0.7],   // 12: front right roof
  [-1.2, 0.85, 0.7],  // 13: rear right roof

  // Wheels (centers)
  [-1.0, -0.4, -0.95], // 14: rear left wheel
  [1.1, -0.4, -0.95],  // 15: front left wheel
  [1.1, -0.4, 0.95],   // 16: front right wheel
  [-1.0, -0.4, 0.95],  // 17: rear right wheel

  // License plate anchor
  [1.62, -0.15, 0],   // 18: front plate anchor
  [-1.62, -0.05, 0],  // 19: rear plate anchor
];

// Edges connecting vertex indices
const EDGES: [number, number][] = [
  // Chassis bottom
  [0, 1], [1, 2], [2, 3], [3, 0],
  // Waistline
  [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 4],
  // Vertical body posts
  [0, 4], [1, 6], [2, 7], [3, 9],
  // Roof pillars (A, B, C pillars)
  [5, 11], [8, 12], // A pillars
  [10, 11], [11, 12], [12, 13], [13, 10], // Roof frame
  [4, 10], [9, 13], // C pillars
  // Hood crossbar
  [5, 8],
  // Windshield cross
  [11, 5], [12, 8],
];

export function VehicleHologram3D({
  plate = "MH12AB1234",
  vehicleType = "White SUV",
  color = "White",
  className = "",
}: VehicleHologram3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [yaw, setYaw] = useState<number>(35);
  const [pitch, setPitch] = useState<number>(20);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [scanMode, setScanMode] = useState<"wireframe" | "hologram" | "thermal">("hologram");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; yaw: number; pitch: number }>({
    x: 0,
    y: 0,
    yaw: 35,
    pitch: 20,
  });
  const scanYRef = useRef<number>(-1.5);

  // Handle Dragging for 3D Manual Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotate(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw,
      pitch,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setYaw((dragStartRef.current.yaw + deltaX * 0.75) % 360);
      setPitch(Math.max(-10, Math.min(60, dragStartRef.current.pitch - deltaY * 0.5)));
    },
    [isDragging],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Advance scan line
      scanYRef.current += 0.035;
      if (scanYRef.current > 1.8) scanYRef.current = -1.8;

      // Advance auto rotate
      if (isAutoRotate && !isDragging) {
        setYaw((prev) => (prev + 0.6) % 360);
      }

      const yawRad = (yaw * Math.PI) / 180;
      const pitchRad = (pitch * Math.PI) / 180;

      // 3D Rotation projection
      // Scale factor to fit canvas
      const scale = Math.min(width, height) * 0.23;
      const centerX = width / 2;
      const centerY = height / 2 + 15;

      const project = (x: number, y: number, z: number): [number, number, number] => {
        // Yaw (around Y axis)
        const cosY = Math.cos(yawRad);
        const sinY = Math.sin(yawRad);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Pitch (around X axis)
        const cosP = Math.cos(pitchRad);
        const sinP = Math.sin(pitchRad);
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        // Orthographic/weak perspective projection
        const depthFactor = 1 / (1 + z2 * 0.18);
        const screenX = centerX + x1 * scale * depthFactor;
        const screenY = centerY - y2 * scale * depthFactor;

        return [screenX, screenY, z2];
      };

      // Draw 3D Ground Grid / Pedestal
      ctx.save();
      ctx.strokeStyle = "rgba(2, 132, 199, 0.18)";
      ctx.lineWidth = 1;
      const gridSteps = 6;
      for (let i = -gridSteps; i <= gridSteps; i += 2) {
        const p1 = project(i * 0.4, -0.45, -gridSteps * 0.3);
        const p2 = project(i * 0.4, -0.45, gridSteps * 0.3);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        const p3 = project(-gridSteps * 0.4, -0.45, i * 0.3);
        const p4 = project(gridSteps * 0.4, -0.45, i * 0.3);
        ctx.beginPath();
        ctx.moveTo(p3[0], p3[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.stroke();
      }

      // 3D Concentric Radar Rings on Ground
      const ringP = project(0, -0.45, 0);
      ctx.beginPath();
      ctx.ellipse(ringP[0], ringP[1], scale * 1.5, scale * 0.75, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(14, 165, 233, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Project vertices
      const projected = BASE_VERTICES.map((v) => project(v[0], v[1], v[2]));

      // Render 3D Edges
      EDGES.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) return;

        ctx.save();
        if (scanMode === "thermal") {
          ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
          ctx.lineWidth = 1.6;
        } else if (scanMode === "wireframe") {
          ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
          ctx.lineWidth = 1.4;
        } else {
          // Hologram glow
          ctx.strokeStyle = "rgba(2, 132, 199, 0.85)";
          ctx.lineWidth = 1.8;
          ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
          ctx.shadowBlur = 6;
        }

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.restore();
      });

      // Render Wheel Hubs with 3D Rings
      [14, 15, 16, 17].forEach((idx) => {
        const wp = projected[idx];
        if (!wp) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(wp[0], wp[1], 10, 0, Math.PI * 2);
        ctx.strokeStyle = scanMode === "thermal" ? "rgba(249, 115, 22, 0.9)" : "rgba(2, 132, 199, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(wp[0], wp[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = "#0284c7";
        ctx.fill();
        ctx.restore();
      });

      // 3D Scanning Laser Plane Bar
      const scanY = scanYRef.current;
      const sp1 = project(-1.9, scanY, -1.2);
      const sp2 = project(1.9, scanY, -1.2);
      const sp3 = project(1.9, scanY, 1.2);
      const sp4 = project(-1.9, scanY, 1.2);

      ctx.save();
      const grad = ctx.createLinearGradient(sp1[0], sp1[1], sp3[0], sp3[1]);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.05)");
      grad.addColorStop(0.5, "rgba(56, 189, 248, 0.35)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.05)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sp1[0], sp1[1]);
      ctx.lineTo(sp2[0], sp2[1]);
      ctx.lineTo(sp3[0], sp3[1]);
      ctx.lineTo(sp4[0], sp4[1]);
      ctx.closePath();
      ctx.fill();

      // Scanning Edge Line
      ctx.strokeStyle = "rgba(14, 165, 233, 0.95)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(sp1[0], sp1[1]);
      ctx.lineTo(sp2[0], sp2[1]);
      ctx.lineTo(sp3[0], sp3[1]);
      ctx.lineTo(sp4[0], sp4[1]);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 3D Floating Target Reticle on License Plate Anchor
      const plateAnchor = projected[18];
      if (plateAnchor) {
        ctx.save();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        const s = 8;
        // Corner brackets
        ctx.beginPath();
        ctx.moveTo(plateAnchor[0] - s, plateAnchor[1] - s + 4);
        ctx.lineTo(plateAnchor[0] - s, plateAnchor[1] - s);
        ctx.lineTo(plateAnchor[0] - s + 4, plateAnchor[1] - s);

        ctx.moveTo(plateAnchor[0] + s - 4, plateAnchor[1] - s);
        ctx.lineTo(plateAnchor[0] + s, plateAnchor[1] - s);
        ctx.lineTo(plateAnchor[0] + s, plateAnchor[1] - s + 4);

        ctx.moveTo(plateAnchor[0] - s, plateAnchor[1] + s - 4);
        ctx.lineTo(plateAnchor[0] - s, plateAnchor[1] + s);
        ctx.lineTo(plateAnchor[0] - s + 4, plateAnchor[1] + s);

        ctx.moveTo(plateAnchor[0] + s - 4, plateAnchor[1] + s);
        ctx.lineTo(plateAnchor[0] + s, plateAnchor[1] + s);
        ctx.lineTo(plateAnchor[0] + s, plateAnchor[1] + s - 4);
        ctx.stroke();

        ctx.fillStyle = "#059669";
        ctx.font = "bold 9px monospace";
        ctx.fillText("ANPR LOCK", plateAnchor[0] + s + 4, plateAnchor[1] + 3);
        ctx.restore();
      }

      // Vertex Highlight Nodes
      projected.slice(0, 14).forEach((pt) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 2, 0, Math.PI * 2);
        ctx.fillStyle = scanMode === "thermal" ? "#f43f5e" : "#0284c7";
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [yaw, pitch, isAutoRotate, scanMode, isDragging]);

  return (
    <div className={`relative flex flex-col rounded-2xl border border-sky-200/90 bg-white/95 p-4 backdrop-blur-xl shadow-xs ${className}`}>
      {/* 3D Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-xs animate-ping" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
            3D SPATIAL VEHICLE RECONSTRUCTION
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {(["hologram", "wireframe", "thermal"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setScanMode(mode)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase transition-all cursor-pointer ${
                scanMode === mode
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div
        className="relative mt-2 flex h-52 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-900/5 to-sky-950/10 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={210}
          className="h-full w-full object-contain"
        />

        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 h-3.5 w-3.5 border-t-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 border-t-2 border-r-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-3.5 w-3.5 border-b-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-3.5 w-3.5 border-b-2 border-r-2 border-sky-400" />

        {/* Telemetry Overlays */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-0.5 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-mono text-slate-700 shadow-xs backdrop-blur-md border border-slate-200">
          <div className="font-bold text-sky-800">{plate}</div>
          <div className="text-slate-500">{vehicleType} • {color}</div>
        </div>

        <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-mono text-slate-700 shadow-xs backdrop-blur-md border border-slate-200">
          <span>YAW: {Math.round(yaw)}°</span>
          <span>PITCH: {Math.round(pitch)}°</span>
        </div>

        <div className="pointer-events-none absolute bottom-2.5 left-2.5 text-[8px] font-mono text-slate-400">
          {isDragging ? "DRAGGING 3D GIMBAL" : "DRAG TO ROTATE 360°"}
        </div>
      </div>

      {/* 3D Telemetry Grid Footer */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
          <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">L x W x H</div>
          <div className="text-[11px] font-bold text-slate-800">4.68 x 1.86 x 1.69 m</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
          <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">YOLOv8 Class</div>
          <div className="text-[11px] font-bold text-emerald-700">SUV (98.4%)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
          <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Auto-Spin</div>
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
          >
            {isAutoRotate ? "ACTIVE [ON]" : "PAUSED [OFF]"}
          </button>
        </div>
      </div>
    </div>
  );
}
