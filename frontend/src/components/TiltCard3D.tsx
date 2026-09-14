"use client";

import React, { useState } from "react";

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
}: TiltCard3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative px-0.5"
    >
      <div
        style={{
          transform: isHovered ? "translateY(-3px)" : "none",
          transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease",
          boxShadow: isHovered
            ? "0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)"
            : "none",
        }}
        className={`relative ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
