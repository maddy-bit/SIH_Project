"use client";

import React, { useRef, useState, useCallback } from "react";

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  scale?: number;
}

/**
 * High-performance 3D card wrapper engineered to keep text razor-sharp.
 * Avoids constant perspective/rotate/preserve-3d when idle so the browser
 * uses full native subpixel ClearType rendering without texture blur.
 */
export function TiltCard3D({
  children,
  className = "",
  maxTilt = 5,
  glare = false,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Subtle tilt delta
      const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
      const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

      const rX = -mouseY * maxTilt;
      const rY = mouseX * maxTilt;

      setRotateX(rX);
      setRotateY(rY);

      if (glare) {
        const gX = ((e.clientX - rect.left) / width) * 100;
        const gY = ((e.clientY - rect.top) / height) * 100;
        setGlarePos({ x: gX, y: gY, opacity: 0.15 });
      }
    },
    [maxTilt, glare],
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // Only apply perspective when hovering to avoid rasterizing text when idle
        perspective: isHovered ? "1000px" : undefined,
      }}
      className="relative"
    >
      <div
        style={{
          // Use clean translate and subtle tilt only on active hover; zero transform when idle
          transform: isHovered
            ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`
            : "none",
          transformStyle: isHovered ? "preserve-3d" : "flat",
          transition: isHovered
            ? "transform 0.08s ease-out"
            : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
        className={`relative ${className}`}
      >
        {children}

        {/* Subtle non-blurring specular sheen on hover */}
        {glare && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200 overflow-hidden"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.25), transparent 75%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
