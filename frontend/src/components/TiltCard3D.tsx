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
      className="relative"
    >
      <div
        style={{
          transform: isHovered ? "translate(-2px, -2px)" : "none",
          transition: "transform 0.1s ease, box-shadow 0.1s ease",
        }}
        className={`relative ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
