"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SystemBootLoaderProps {
  onComplete: () => void;
  isOpen: boolean;
}

const CAMERAS_BOOT = [
  { id: "CAM-01", name: "Shivajinagar Chowk", angle: 45, dist: 0.35, status: "ONLINE" },
  { id: "CAM-02", name: "Sancheti Hospital", angle: 75, dist: 0.55, status: "ONLINE" },
  { id: "CAM-03", name: "JM Road - Deccan", angle: 110, dist: 0.42, status: "TARGET_LOCK" },
  { id: "CAM-04", name: "FC Road - Goodluck", angle: 140, dist: 0.65, status: "ONLINE" },
  { id: "CAM-05", name: "Alka Talkies", angle: 180, dist: 0.48, status: "ONLINE" },
  { id: "CAM-06", name: "Swargate Bus Station", angle: 215, dist: 0.72, status: "ONLINE" },
  { id: "CAM-07", name: "Kothrud Depot", angle: 250, dist: 0.85, status: "ONLINE" },
  { id: "CAM-08", name: "Paud Road Flyover", angle: 275, dist: 0.62, status: "ONLINE" },
  { id: "CAM-09", name: "University Circle", angle: 310, dist: 0.52, status: "ONLINE" },
  { id: "CAM-10", name: "Senapati Bapat Rd", angle: 335, dist: 0.4, status: "ONLINE" },
  { id: "CAM-11", name: "Aundh - ITI Road", angle: 15, dist: 0.78, status: "ONLINE" },
  { id: "CAM-12", name: "Bremen Chowk", angle: 355, dist: 0.88, status: "ONLINE" },
];

const CYBER_LOGS = [
  { text: "INITIALIZING CYBERNETIC NEURAL CORE // MATRIX BUS ARMED", pct: 15, hex: "0x7F00A1" },
  { text: "ACTIVATING PUNE 12-NODE 4K MESH SENSORS & LIDAR TELEMETRY", pct: 35, hex: "0x8B32C4" },
  { text: "INJECTING YOLOV8x TENSOR ENGINE // BOUNDING CLASSIFIERS READY", pct: 55, hex: "0x91F05D" },
  { text: "CALIBRATING HSRP HIGH-RESOLUTION OCR RECOGNITION MATRIX", pct: 75, hex: "0x2A77E9" },
  { text: "SPATIO-TEMPORAL 3D TRAJECTORY GRAPH SYNCHRONIZED", pct: 90, hex: "0xFA110B" },
  { text: "CYBER SURVEILLANCE MATRIX ARMED // SYSTEM ACTIVE", pct: 100, hex: "0x059669" },
];

// 3D Cyber Vehicle Model Wireframe Vertices
const CYBER_VERTICES: [number, number, number][] = [
  // Chassis base
  [-2.2, -0.4, -0.9], // 0: rear-left low
  [2.1, -0.4, -0.9],  // 1: front-left low
  [2.1, -0.4, 0.9],   // 2: front-right low
  [-2.2, -0.4, 0.9],  // 3: rear-right low

  // Bumper / Splitter Nose
  [2.4, -0.15, -0.75], // 4: nose left
  [2.4, -0.15, 0.75],  // 5: nose right

  // Waistline & Hood
  [1.4, 0.15, -0.95], // 6: cowl left
  [1.4, 0.15, 0.95],  // 7: cowl right
  [-1.0, 0.25, -0.95], // 8: rear belt left
  [-1.0, 0.25, 0.95],  // 9: rear belt right
  [-2.2, 0.05, -0.95], // 10: tail left
  [-2.2, 0.05, 0.95],  // 11: tail right

  // Cockpit Roofline
  [0.5, 0.85, -0.72],  // 12: windshield top left
  [0.5, 0.85, 0.72],   // 13: windshield top right
  [-1.1, 0.8, -0.68],  // 14: roof rear left
  [-1.1, 0.8, 0.68],   // 15: roof rear right

  // Cyber Aero Rear Spoiler
  [-2.35, 0.45, -0.95], // 16: wing left
  [-2.35, 0.45, 0.95],  // 17: wing right
  [-2.1, 0.15, 0],      // 18: wing center mount

  // LIDAR Sensor Pod on roof
  [-0.1, 0.98, -0.25], // 19: lidar left
  [-0.1, 0.98, 0.25],  // 20: lidar right
  [0.2, 0.98, 0],      // 21: lidar front

  // Wheels Anchor Points
  [1.3, -0.4, -1.05],  // 22: wheel FL
  [1.3, -0.4, 1.05],   // 23: wheel FR
  [-1.3, -0.4, -1.05], // 24: wheel RL
  [-1.3, -0.4, 1.05],  // 25: wheel RR
];

// Edges connecting 3D Cyber Car vertices
const CYBER_EDGES: [number, number][] = [
  // Chassis bottom
  [0, 1], [1, 2], [2, 3], [3, 0],
  // Front nose & hood
  [1, 4], [2, 5], [4, 5], [4, 6], [5, 7], [6, 7],
  // Beltline
  [6, 8], [7, 9], [8, 10], [9, 11], [10, 11],
  // Body verticals
  [0, 10], [3, 11], [1, 6], [2, 7],
  // Cockpit & Windshield
  [6, 12], [7, 13], [12, 13], [12, 14], [13, 15], [14, 15],
  [8, 14], [9, 15],
  // Fastback diagonals
  [14, 10], [15, 11],
  // Aero Spoiler
  [10, 16], [11, 17], [16, 17], [18, 16], [18, 17],
  // Roof LIDAR pod
  [19, 20], [20, 21], [21, 19],
  // Windshield crossbracing
  [6, 13], [7, 12],
];

export function SystemBootLoader({ onComplete, isOpen }: SystemBootLoaderProps) {
  const carCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [renderMode, setRenderMode] = useState<"HOLOGRAM" | "WIREFRAME" | "THERMAL">("HOLOGRAM");

  // 3D Car Orbit Controls (using refs for 60fps canvas loop to prevent state re-render loops)
  const carYawRef = useRef<number>(38);
  const carPitchRef = useRef<number>(18);
  const isAutoRotateRef = useRef<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; yaw: number; pitch: number }>({
    x: 0,
    y: 0,
    yaw: 38,
    pitch: 18,
  });

  const [displayYaw, setDisplayYaw] = useState<number>(38);
  const [isAutoRotateState, setIsAutoRotateState] = useState<boolean>(true);

  const scanZRef = useRef<number>(-2.5);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Cyber Synthesizer
  const playCyberBeep = useCallback((freq: number, type: OscillatorType = "sine", duration: number = 0.08, vol: number = 0.04) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context policy
    }
  }, [soundEnabled]);

  // Toggle Auto Rotation
  const toggleAutoRotate = () => {
    const nextVal = !isAutoRotateRef.current;
    isAutoRotateRef.current = nextVal;
    setIsAutoRotateState(nextVal);
  };

  // Handle Drag to Rotate 3D Cyber Car
  const handleCarMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    isAutoRotateRef.current = false;
    setIsAutoRotateState(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: carYawRef.current,
      pitch: carPitchRef.current,
    };
  };

  const handleCarMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newYaw = (dragStartRef.current.yaw + dx * 0.75) % 360;
    const newPitch = Math.max(-30, Math.min(65, dragStartRef.current.pitch - dy * 0.5));
    carYawRef.current = newYaw < 0 ? newYaw + 360 : newYaw;
    carPitchRef.current = newPitch;
    setDisplayYaw(Math.round(carYawRef.current));
  }, []);

  const handleCarMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Progressive Loading Simulation
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = Math.min(100, prev + 2);
        const stepIdx = CYBER_LOGS.findIndex((s) => next <= s.pct);
        if (stepIdx !== -1 && stepIdx !== activeStep) {
          setActiveStep(stepIdx);
          playCyberBeep(480 + stepIdx * 80, "sine", 0.05, 0.04);
        }
        return next;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [isOpen, activeStep, playCyberBeep]);

  // 1. Render 3D Cyber Car Canvas (Custom White-Theme 3D Projection Engine)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = carCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastYawUpdate = Date.now();

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = 680;
      const displayHeight = 400;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = displayWidth;
      const height = displayHeight;
      const cx = width / 2;
      const cy = height / 2 + 10;

      ctx.clearRect(0, 0, width, height);

      // Smooth auto-rotation update inside animation frame without triggering React re-renders
      if (isAutoRotateRef.current) {
        carYawRef.current = (carYawRef.current + 0.45) % 360;
      }

      // Throttled UI state update for display yaw reading (every 150ms)
      const now = Date.now();
      if (now - lastYawUpdate > 150) {
        setDisplayYaw(Math.round(carYawRef.current));
        lastYawUpdate = now;
      }

      // Scanner laser Z-position cycle
      scanZRef.current += 0.045;
      if (scanZRef.current > 2.6) scanZRef.current = -2.6;
      const currentScanZ = scanZRef.current;

      // Rotation angles in radians
      const radYaw = (carYawRef.current * Math.PI) / 180;
      const radPitch = (carPitchRef.current * Math.PI) / 180;

      // 3D Perspective Projection Function (Scaled for Large High-Def Viewport)
      const project = (x: number, y: number, z: number): { px: number; py: number; depth: number; origZ: number } => {
        const cosY = Math.cos(radYaw);
        const sinY = Math.sin(radYaw);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        const cosP = Math.cos(radPitch);
        const sinP = Math.sin(radPitch);
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        const distance = 4.6;
        const fov = 560;
        const depth = z2 + distance;
        const scale = fov / Math.max(depth, 0.1);

        return {
          px: cx + x1 * scale,
          py: cy - y2 * scale,
          depth,
          origZ: x,
        };
      };

      // Cyber Holographic Ground Projection Grid (Clean Sky Blue on White)
      ctx.save();
      const gridSize = 8;
      const spacing = 0.7;
      ctx.strokeStyle = "rgba(2, 132, 199, 0.18)";
      ctx.lineWidth = 1;

      for (let gx = -gridSize; gx <= gridSize; gx++) {
        const p1 = project(gx * spacing, -0.42, -gridSize * spacing);
        const p2 = project(gx * spacing, -0.42, gridSize * spacing);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
      for (let gz = -gridSize; gz <= gridSize; gz++) {
        const p1 = project(-gridSize * spacing, -0.42, gz * spacing);
        const p2 = project(gridSize * spacing, -0.42, gz * spacing);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
      ctx.restore();

      // Project vertices
      const projected = CYBER_VERTICES.map(([x, y, z]) => project(x, y, z));

      // Draw 3D Edges
      CYBER_EDGES.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];

        const avgX = (CYBER_VERTICES[i][0] + CYBER_VERTICES[j][0]) / 2;
        const distToLaser = Math.abs(avgX - currentScanZ);
        const isLaserLit = distToLaser < 0.45;

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);

        if (renderMode === "THERMAL") {
          const hue = 220 - Math.min(180, distToLaser * 100);
          ctx.strokeStyle = `hsl(${hue}, 95%, 45%)`;
          ctx.lineWidth = isLaserLit ? 3.0 : 2.0;
        } else if (renderMode === "WIREFRAME") {
          ctx.strokeStyle = isLaserLit ? "#0284c7" : "#0f172a";
          ctx.lineWidth = isLaserLit ? 2.8 : 1.8;
        } else {
          // HOLOGRAM (Default Crisp Sky-Blue on White)
          ctx.strokeStyle = isLaserLit ? "#0284c7" : "#0369a1";
          ctx.lineWidth = isLaserLit ? 2.8 : 1.8;
          ctx.shadowColor = isLaserLit ? "rgba(2, 132, 199, 0.4)" : "transparent";
          ctx.shadowBlur = isLaserLit ? 10 : 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw 3D Polygon Faces with Translucent Fill
      if (renderMode === "HOLOGRAM") {
        const faces: [number, number, number, number][] = [
          [6, 7, 5, 4],    // Hood
          [12, 13, 7, 6],  // Windshield
          [14, 15, 13, 12],// Roof
          [8, 9, 15, 14],  // Rear window
          [4, 5, 2, 1],    // Front bumper
          [16, 17, 11, 10],// Tail
        ];

        ctx.save();
        faces.forEach((face) => {
          ctx.beginPath();
          face.forEach((idx, k) => {
            const p = projected[idx];
            if (k === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(2, 132, 199, 0.08)";
          ctx.fill();
        });
        ctx.restore();
      }

      // Draw 3D Wheels with Precision Rims
      [22, 23, 24, 25].forEach((wIdx) => {
        const wCenter = CYBER_VERTICES[wIdx];
        const wheelRadius = 0.35;
        const wheelSegments = 10;

        ctx.save();
        ctx.beginPath();
        for (let s = 0; s <= wheelSegments; s++) {
          const theta = (s * 2 * Math.PI) / wheelSegments;
          const wp = project(
            wCenter[0] + Math.sin(theta) * wheelRadius,
            wCenter[1] + Math.cos(theta) * wheelRadius,
            wCenter[2]
          );
          if (s === 0) ctx.moveTo(wp.px, wp.py);
          else ctx.lineTo(wp.px, wp.py);
        }
        ctx.closePath();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Vertex Nodes
      projected.forEach((p, idx) => {
        const v = CYBER_VERTICES[idx];
        const isLaserLit = Math.abs(v[0] - currentScanZ) < 0.45;

        ctx.beginPath();
        ctx.arc(p.px, p.py, isLaserLit ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isLaserLit ? "#0284c7" : "#0f172a";
        ctx.fill();
      });

      // 3D Laser Scanning Plane Slice
      ctx.save();
      const planeTopL = project(currentScanZ, 1.2, -1.3);
      const planeTopR = project(currentScanZ, 1.2, 1.3);
      const planeBtmR = project(currentScanZ, -0.5, 1.3);
      const planeBtmL = project(currentScanZ, -0.5, -1.3);

      ctx.beginPath();
      ctx.moveTo(planeTopL.px, planeTopL.py);
      ctx.lineTo(planeTopR.px, planeTopR.py);
      ctx.lineTo(planeBtmR.px, planeBtmR.py);
      ctx.lineTo(planeBtmL.px, planeBtmL.py);
      ctx.closePath();
      ctx.fillStyle = "rgba(14, 165, 233, 0.14)";
      ctx.strokeStyle = "rgba(2, 132, 199, 0.85)";
      ctx.lineWidth = 2.0;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // HUD 3D Tracking Bracket over Target Vehicle
      const roofCenter = project(-0.2, 0.9, 0);
      ctx.save();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.8;
      const bSize = 16;
      ctx.strokeRect(roofCenter.px - bSize, roofCenter.py - bSize, bSize * 2, bSize * 2);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 10px monospace";
      ctx.fillText("TARGET: WHITE SUV // ANPR LOCKED", roofCenter.px - 75, roofCenter.py - bSize - 10);
      ctx.restore();

      ctx.restore(); // Restore dpr scale

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, renderMode]);

  // 2. Render 3D Holographic Pune Surveillance Radar Sphere (White Theme)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let sweep = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 22;

      ctx.clearRect(0, 0, width, height);

      // Radar Range Rings
      [0.3, 0.6, 0.85, 1.0].forEach((rRatio, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * rRatio, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 3 ? "rgba(2, 132, 199, 0.45)" : "rgba(2, 132, 199, 0.2)";
        ctx.lineWidth = idx === 3 ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
        ctx.font = "bold 8px monospace";
        ctx.fillText(`${(rRatio * 5).toFixed(1)}KM`, cx + 6, cy - radius * rRatio + 9);
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.strokeStyle = "rgba(2, 132, 199, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating Sweep Beam
      sweep = (sweep + 0.038) % (Math.PI * 2);
      const grad = ctx.createConicGradient(sweep, cx, cy);
      grad.addColorStop(0, "rgba(2, 132, 199, 0.35)");
      grad.addColorStop(0.12, "rgba(14, 165, 233, 0.15)");
      grad.addColorStop(0.28, "rgba(2, 132, 199, 0)");
      grad.addColorStop(1, "rgba(2, 132, 199, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Sweep Leading Edge Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius);
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Surveillance Camera Nodes
      CAMERAS_BOOT.forEach((cam) => {
        const rad = (cam.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * (radius * cam.dist);
        const y = cy + Math.sin(rad) * (radius * cam.dist);

        let diff = Math.abs(sweep - rad) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        const isPinged = diff < 0.35;

        // Camera Node Circle
        ctx.beginPath();
        ctx.arc(x, y, isPinged ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isPinged ? "#059669" : "#0284c7";
        ctx.fill();

        // Node Label
        ctx.fillStyle = isPinged ? "#059669" : "#0f172a";
        ctx.font = "bold 8px monospace";
        ctx.fillText(cam.id, x + 5, y - 4);
      });

      // Active Target Locked Blip
      const targetRad = (110 * Math.PI) / 180;
      const tx = cx + Math.cos(targetRad) * (radius * 0.42);
      const ty = cy + Math.sin(targetRad) * (radius * 0.42);

      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#e11d48";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(tx, ty, 13, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(225, 29, 72, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#be123c";
      ctx.font = "bold 9px monospace";
      ctx.fillText("TARGET: WHITE SUV", tx + 8, ty + 12);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xl text-slate-900 overflow-y-auto p-3 sm:p-6"
      >
        {/* Subtle Cyber Blueprint Background Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(2, 132, 199, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(2, 132, 199, 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top Sci-Fi Quick Action Header */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-mono font-bold backdrop-blur-md transition-all cursor-pointer shadow-xs ${
              soundEnabled
                ? "border-sky-300 bg-sky-50 text-sky-800"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            <span>{soundEnabled ? "🔊 AUDIO: ON" : "🔇 AUDIO: MUTED"}</span>
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="flex items-center gap-1.5 rounded-xl border border-sky-600 bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-1.5 text-xs font-mono font-extrabold text-white shadow-md hover:from-sky-500 hover:to-blue-600 transition-all cursor-pointer"
          >
            <span>⚡ SKIP BOOT</span>
          </button>
        </div>

        {/* Main Central Cyber White Terminal Frame */}
        <div className="relative w-full max-w-6xl rounded-3xl border border-slate-200/90 bg-white/98 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
          {/* Cyber Header Bar with Light Accents */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 text-sky-700 shadow-xs">
                <span className="text-xl">🏙️</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-mono font-black text-sky-800 border border-sky-200">
                    SYS-01 // READY
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    SMART CITY TRAFFIC SURVEILLANCE
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>City AI Traffic Network Initialization</span>
                  <span className="text-xs font-mono font-bold text-sky-800 px-2 py-0.5 rounded border border-sky-200 bg-sky-50">
                    v2.4 STABLE
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right font-mono text-[11px]">
                <span className="text-slate-500">SYSTEM CALIBRATION</span>
                <span className="font-extrabold text-sky-700">
                  INITIALIZATION: {progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Core 3D Cyberpunk Workspace: 2-Column Split */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left 7 Columns: Interactive 3D Cyber Vehicle Hologram Viewport */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 relative overflow-hidden shadow-inner">
              {/* Viewport Top Tactical Strip */}
              <div className="flex items-center justify-between z-10 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                  <span className="text-[11px] font-mono font-black text-slate-800 tracking-wider uppercase">
                    3D HOLOGRAPHIC TARGET INTERCEPTOR
                  </span>
                </div>

                {/* 3D Render Mode Switchers */}
                <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200 text-[10px] font-mono font-bold shadow-xs">
                  {(["HOLOGRAM", "WIREFRAME", "THERMAL"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenderMode(m)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        renderMode === m
                          ? "bg-sky-600 text-white font-black shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Canvas with Drag-to-Rotate Interaction */}
              <div
                className="relative flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing min-h-[340px]"
                onMouseDown={handleCarMouseDown}
                onMouseMove={handleCarMouseMove}
                onMouseUp={handleCarMouseUp}
              >
                <canvas
                  ref={carCanvasRef}
                  width={680}
                  height={400}
                  className="max-w-full h-auto w-full object-contain"
                />

                {/* HUD Reticles in Corners */}
                <div className="pointer-events-none absolute top-1 left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-sky-500" />
                <div className="pointer-events-none absolute top-1 right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-sky-500" />
                <div className="pointer-events-none absolute bottom-1 left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-sky-500" />
                <div className="pointer-events-none absolute bottom-1 right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-sky-500" />

                {/* Drag Hint */}
                <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] font-mono text-slate-600 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5">
                  <span>🖱️ CLICK & DRAG TO ROTATE 3D MODEL</span>
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] font-mono flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAutoRotate}
                    className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-bold ${
                      isAutoRotateState
                        ? "bg-sky-50 border-sky-200 text-sky-700"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  >
                    {isAutoRotateState ? "↻ ROTATE: ON" : "⏸ ROTATE: PAUSED"}
                  </button>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-bold shadow-xs">
                    LASER SCAN: ACTIVE
                  </span>
                </div>
              </div>

              {/* 3D Telemetry Strip */}
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-200 pt-2">
                <span>POLYGONS: 36 EDGES // 26 VERTICES</span>
                <span className="text-sky-700 font-bold">ROTATION: {displayYaw}° YAW</span>
                <span className="text-emerald-700 font-bold">LIDAR: 60 FPS SYNC</span>
              </div>
            </div>

            {/* Right 5 Columns: 3D Sector Radar & Diagnostics Log */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {/* 3D Holographic Pune Radar Hemisphere */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-sky-50/40 p-4 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-[11px] font-mono mb-2 text-slate-600">
                  <span className="text-sky-800 font-extrabold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    PUNE SECTOR-01 3D MESH
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    12 NODES ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <canvas
                    ref={globeCanvasRef}
                    width={340}
                    height={210}
                    className="max-w-full h-auto"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>RANGE: 5.0 KM</span>
                  <span>SURVEILLANCE RADAR: ARMED</span>
                </div>
              </div>

              {/* AI Matrix Real-Time Diagnostic Telemetry Log */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 font-mono text-xs shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    SYSTEM DIAGNOSTICS & TELEMETRY
                  </span>
                  <span className="text-sky-700 font-semibold">STREAM ACTIVE</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-hidden">
                  {CYBER_LOGS.map((log, idx) => {
                    const isDone = progress >= log.pct;
                    const isCurrent = activeStep === idx && !isDone;

                    return (
                      <div
                        key={log.hex}
                        className={`flex items-center justify-between text-[10px] font-mono transition-colors ${
                          isDone
                            ? "text-slate-800 font-medium"
                            : isCurrent
                            ? "text-sky-700 font-bold bg-sky-50 px-1 py-0.5 rounded"
                            : "text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={isDone ? "text-emerald-600" : isCurrent ? "text-sky-600 font-bold" : "text-slate-400"}>
                            {isDone ? "✓" : isCurrent ? "►" : "·"}
                          </span>
                          <span className="truncate">{log.text}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0 font-semibold">{log.hex}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar & Launch CTA Footer */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                SYSTEM INITIALIZATION PROTOCOLS
              </span>
              <span className="text-sky-700">{progress}% COMPLETE</span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 shadow-xs"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Access 3D Surveillance Matrix Button */}
            <motion.button
              type="button"
              disabled={progress < 100}
              onClick={onComplete}
              whileHover={{ scale: progress === 100 ? 1.02 : 1 }}
              whileTap={{ scale: progress === 100 ? 0.98 : 1 }}
              className={`mt-1 flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-mono font-extrabold tracking-widest uppercase transition-all shadow-md cursor-pointer ${
                progress === 100
                  ? "bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 text-white shadow-emerald-500/20 hover:from-sky-500 hover:to-emerald-500"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>
                {progress === 100
                  ? "⚡ ACCESS 3D SURVEILLANCE MATRIX →"
                  : "INITIALIZING SENSORS & 3D MESH..."}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
