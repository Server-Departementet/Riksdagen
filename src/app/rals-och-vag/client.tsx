"use client";

import { useRef } from "react";

export function RailsAndRoadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div>
      <canvas
        ref={canvasRef}
      ></canvas>
      <style>{`
        canvas {
          background: #eee;
        }
      `}</style>
    </div>
  );
}