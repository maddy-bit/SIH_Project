"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SystemBootLoaderProps {
  onComplete: () => void;
  isOpen: boolean;
}

const CAMERAS_BOOT = [
  { id: "CAM-01", name: "Shivajinagar Chowk", angle: 45, dist: 0.35, status: "LOCKED" },
  { id: "CAM-02", name: "Sancheti Hospital Jnc", angle: 75, dist: 0.55, status: "LOCKED" },
  { id: "CAM-03", name: "JM Road - Deccan Gymkhana", angle: 110, dist: 0.42, status: "LOCKED" },
  { id: "CAM-04", name: "FC Road - Goodluck Chowk", angle: 140, dist: 0.65, status: "LOCKED" },
  { id: "CAM-05", name: "Alka Talkies Chowk", angle: 180, dist: 0.48, status: "LOCKED" },
  { id: "CAM-06", name: "Swargate Bus Station", angle: 215, dist: 0.72, status: "LOCKED" },
  { id: "CAM-07", name: "Kothrud Depot", angle: 250, dist: 0.85, status: "LOCKED" },
  { id: "CAM-08", name: "Paud Road Flyover", angle: 275, dist: 0.62, status: "LOCKED" },
  { id: "CAM-09", name: "University Circle", angle: 310, dist: 0.52, status: "LOCKED" },
  { id: "CAM-10", name: "Senapati Bapat Road", angle: 335, dist: 0.4, status: "LOCKED" },
  { id: "CAM-11", name: "Aundh - ITI Road", angle: 15, dist: 0.78, status: "LOCKED" },
  { id: "CAM-12", name: "Bremen Chowk", angle: 355, dist: 0.88, status: "LOCKED" },
];

const LOG_STEPS = [
  { text: "INITIALIZING HIGH-SPEED CCTV SURVEILLANCE MESH (12 NODES)...", pct: 20 },
  { text: "CALIBRATING YOLOV8 VEHICLE RE-IDENTIFICATION & BOUNDING WEIGHTS...", pct: 45 },
  { text: "LOADING EASYOCR INDIAN HSRP HIGH-RESOLUTION OCR RECOGNITION CORE...", pct: 70 },
  { text: "CONSTRUCTING 3D SPATIO-TEMPORAL TRAJECTORY GRAPH NETWORK...", pct: 90 },
  { text: "SURVEILLANCE MATRIX ARMED: CITY TRAFFIC INTELLIGENCE ONLINE.", pct: 100 },
];

export function SystemBootLoader({ onComplete, isOpen }: SystemBootLoaderProps) {
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [ocrText, setOcrText] = useState("MH 12 ## 9999");
  const [isLocked, setIsLocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic Web Audio sci-fi sound without external files
  const playBeep = useCallback((freq: number, type: OscillatorType = "sine", duration: number = 0.08) => {
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
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context blocked by browser policy
    }
  }, [soundEnabled]);

  // Handle OCR dynamic matrix rolling effect
  useEffect(() => {
    if (!isOpen) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const target = "MH 12 AB 1234";
    let iterations = 0;

    const interval = setInterval(() => {
      setOcrText(() => {
        if (iterations > 18) {
          clearInterval(interval);
          setIsLocked(true);
          playBeep(880, "triangle", 0.25);
          return target;
        }

        const scrambled = target
          .split("")
          .map((c, i) => {
            if (c === " ") return " ";
            if (i < iterations / 2) return c;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        iterations++;
        playBeep(320 + iterations * 20, "sine", 0.03);
        return scrambled;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen, playBeep]);

  // Progressive loading simulation
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = Math.min(100, prev + 2);
        const stepIdx = LOG_STEPS.findIndex((s) => next <= s.pct);
        if (stepIdx !== -1 && stepIdx !== activeStep) {
          setActiveStep(stepIdx);
          playBeep(520, "sine", 0.05);
        }
        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [isOpen, activeStep, playBeep]);

  // Radar Animation Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 20;

      ctx.clearRect(0, 0, width, height);

      // Radar Concentric Circles
      [0.25, 0.5, 0.75, 1.0].forEach((ratio, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 3 ? "rgba(14, 165, 233, 0.45)" : "rgba(2, 132, 199, 0.18)";
        ctx.lineWidth = idx === 3 ? 2 : 1;
        ctx.stroke();

        // Distance text
        ctx.fillStyle = "rgba(14, 165, 233, 0.6)";
        ctx.font = "8px monospace";
        ctx.fillText(`${(ratio * 5).toFixed(1)}km`, cx + 6, cy - radius * ratio + 10);
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.strokeStyle = "rgba(2, 132, 199, 0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating Radar Beam
      sweepAngle = (sweepAngle + 0.04) % (Math.PI * 2);

      const grad = ctx.createConicGradient(sweepAngle, cx, cy);
      grad.addColorStop(0, "rgba(2, 132, 199, 0.4)");
      grad.addColorStop(0.12, "rgba(56, 189, 248, 0.15)");
      grad.addColorStop(0.25, "rgba(56, 189, 248, 0)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Radar Sweep Leading Edge Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Camera Nodes
      CAMERAS_BOOT.forEach((cam) => {
        const rad = (cam.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * (radius * cam.dist);
        const y = cy + Math.sin(rad) * (radius * cam.dist);

        // Distance from sweep angle
        let angleDiff = Math.abs(sweepAngle - rad) % (Math.PI * 2);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const isPinged = angleDiff < 0.35;

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, isPinged ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isPinged ? "#38bdf8" : "#0284c7";
        ctx.shadowColor = isPinged ? "#38bdf8" : "transparent";
        ctx.shadowBlur = isPinged ? 12 : 0;
        ctx.fill();

        if (isPinged) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Node Label
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.font = "bold 8px monospace";
        ctx.fillText(cam.id, x + 6, y - 4);
      });

      // Target vehicle blip on radar
      const targetRad = (110 * Math.PI) / 180;
      const tx = cx + Math.cos(targetRad) * (radius * 0.42);
      const ty = cy + Math.sin(targetRad) * (radius * 0.42);

      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(tx, ty, 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#059669";
      ctx.font = "bold 9px monospace";
      ctx.fillText("TARGET: MH12AB1234", tx + 8, ty + 12);

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
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl overflow-y-auto p-4 sm:p-6"
      >
        {/* Background Cybernetic Grid Lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating Controls Bar */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 sm:gap-3">
          {/* Audio Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-950/80 px-3 py-1.5 text-[11px] font-mono font-bold text-sky-300 backdrop-blur-md hover:bg-sky-900/80 transition-all cursor-pointer shadow-sm"
          >
            <span>{soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF"}</span>
          </button>

          {/* Quick Skip Button */}
          <button
            type="button"
            onClick={onComplete}
            className="flex items-center gap-1.5 rounded-xl border border-sky-400/60 bg-sky-600/90 px-3.5 py-1.5 text-xs font-mono font-bold text-white shadow-md hover:bg-sky-500 transition-all cursor-pointer"
          >
            <span>⚡ Skip Boot</span>
          </button>
        </div>

        {/* Main Central Diagnostic Terminal Frame */}
        <div className="relative w-full max-w-4xl rounded-3xl border border-sky-300/40 bg-white/95 p-6 sm:p-8 text-slate-900 shadow-2xl backdrop-blur-2xl">
          {/* Top Hologram Decorative Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/80 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md">
                <span className="text-xl">🏙️</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-mono font-black text-sky-800 border border-sky-200">
                    SIH26127
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    SMART CITY TRAFFIC SURVEILLANCE
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900">
                  City AI Neural Matrix Initialization
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-700">
                AI CORE BOOTING • {progress}%
              </span>
            </div>
          </div>

          {/* Center 2-Column Showcase */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left: Interactive 3D Geospatial Radar Mesh */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/70 to-blue-50/40 p-4 shadow-inner relative overflow-hidden">
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-0.5 text-[9px] font-mono font-bold text-sky-800 shadow-xs border border-sky-200">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span>PUNE SECTOR-01 RADAR MESH</span>
              </div>
              <canvas
                ref={radarCanvasRef}
                width={340}
                height={280}
                className="max-w-full h-auto"
              />
              <div className="mt-2 flex w-full items-center justify-between text-[10px] font-mono text-slate-500">
                <span>12 CAMERA NODES</span>
                <span>RANGE: 5.0 KM</span>
                <span className="text-emerald-700 font-bold">ALL SENSORS SYNCED</span>
              </div>
            </div>

            {/* Right: Problem Solution - ANPR Target Lock & AI Engines */}
            <div className="flex flex-col justify-between gap-4">
              {/* 3D Holographic ANPR License Plate Target Lock */}
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white to-sky-50/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Target Lock Hologram</span>
                  <span className={isLocked ? "text-emerald-600 font-bold" : "text-sky-600 animate-pulse"}>
                    {isLocked ? "✓ TARGET CONFIRMED" : "⚡ DECRYPTING PLATE..."}
                  </span>
                </div>

                {/* 3D Embossed Reflective Plate */}
                <div className="plate-3d-light relative flex items-center overflow-hidden rounded-xl border-2 border-slate-300 bg-white py-1">
                  <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-700 px-3 py-2 text-white font-black select-none border-r border-slate-300 shadow-xs">
                    <span className="text-[9px] tracking-tighter leading-none">IND</span>
                    <span className="text-[11px] leading-tight mt-0.5">🇮🇳</span>
                  </div>
                  <div className="flex-1 px-4 py-1.5 font-mono text-xl sm:text-2xl font-black tracking-widest text-slate-900">
                    {ocrText}
                  </div>
                  <div className="pr-3">
                    <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                      98.4%
                    </span>
                  </div>

                  {/* Scanning Laser Beam */}
                  <motion.div
                    animate={{ left: ["-10%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    className="pointer-events-none absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Class: White SUV</span>
                  <span>Engine: YOLOv8 + EasyOCR</span>
                  <span className="text-sky-700 font-bold">Pune RTO MH-12</span>
                </div>
              </div>

              {/* Progressive Diagnostic Steps */}
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 shadow-inner">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                  System Diagnostics & Calibration
                </div>
                {LOG_STEPS.map((step, idx) => {
                  const isDone = progress >= step.pct;
                  const isCurrent = activeStep === idx && !isDone;

                  return (
                    <div
                      key={step.pct}
                      className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                        isDone
                          ? "text-slate-800 font-medium"
                          : isCurrent
                          ? "text-sky-700 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      <span className="shrink-0 text-sm">
                        {isDone ? "✅" : isCurrent ? "⏳" : "⚪"}
                      </span>
                      <span className="truncate text-[11px]">{step.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress Bar & Action Button Footer */}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600">
              <span>INITIALIZING SYSTEM PROTOCOLS</span>
              <span>{progress}% COMPLETE</span>
            </div>

            {/* Glowing 3D Progress Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Enter Button */}
            <motion.button
              type="button"
              disabled={progress < 100}
              onClick={onComplete}
              whileHover={{ scale: progress === 100 ? 1.02 : 1 }}
              whileTap={{ scale: progress === 100 ? 0.98 : 1 }}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-mono font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer ${
                progress === 100
                  ? "bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-emerald-500/25 hover:from-sky-500 hover:to-emerald-500"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>{progress === 100 ? "⚡ ACCESS 3D SURVEILLANCE MATRIX" : "SYSTEM SYNCHRONIZING..."}</span>
              {progress === 100 && <span>→</span>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
