"use client";

import type { Dispatch, PointerEvent as ReactPointerEvent, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type { PlanData } from "@/lib/planner/plan";
import { clamp } from "@/lib/planner/plan";
import type { View3d } from "@/lib/planner/scene3d";
import { buildScene, sceneViewBox } from "@/lib/planner/scene3d";
import { PALETTE } from "@/components/planner/stage";

/** The crude 3D view: drag to turn, scroll or pinch to zoom, Shift-drag to pan. */
export function Stage3d(
  { plan, view, setView, sel, svgRef }: {
    plan: PlanData;
    view: View3d;
    setView: Dispatch<SetStateAction<View3d>>;
    sel: ReadonlySet<string>;
    svgRef: RefObject<SVGSVGElement | null>;
  },
) {
  const [aspect, setAspect] = useState(1.4);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setAspect(r.width / r.height);
    });
    observer.observe(svg);
    // React's onWheel is passive, and the page must not scroll while zooming.
    const onWheel = (evt: WheelEvent) => {
      evt.preventDefault();
      setView((v) => ({ ...v, zoom: clamp(v.zoom * Math.exp(-evt.deltaY * 0.0015), 0.4, 8) }));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => { observer.disconnect(); svg.removeEventListener("wheel", onWheel); };
  }, [svgRef, setView]);

  const scene = buildScene(plan, view, sel);
  const box = sceneViewBox(scene, view, aspect);

  function onPointerDown(evt: ReactPointerEvent<SVGSVGElement>) {
    touches.current.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    try { evt.currentTarget.setPointerCapture(evt.pointerId); }
    catch { /* synthetic event */ }
    const [a, b] = [...touches.current.values()];
    if (a && b) pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
  }
  function onPointerMove(evt: ReactPointerEvent<SVGSVGElement>) {
    const last = touches.current.get(evt.pointerId);
    if (!last) return;
    touches.current.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    const dx = evt.clientX - last.x, dy = evt.clientY - last.y;
    const [a, b] = [...touches.current.values()];
    if (a && b) {
      const dist = Math.hypot(a.x - b.x, a.y - b.y), before = pinch.current;
      if (before > 0) setView((v) => ({ ...v, zoom: clamp((v.zoom * dist) / before, 0.4, 8) }));
      pinch.current = dist;
    }
    else if (evt.shiftKey) {
      const k = box.w / evt.currentTarget.getBoundingClientRect().width;
      setView((v) => ({ ...v, px: v.px - dx * k, py: v.py - dy * k }));
    }
    else setView((v) => ({ ...v, yaw: (v.yaw - dx * 0.4) % 360, pitch: clamp(v.pitch + dy * 0.3, 12, 90) }));
  }
  function onPointerEnd(evt: ReactPointerEvent<SVGSVGElement>) {
    touches.current.delete(evt.pointerId);
    pinch.current = 0;
  }

  return (
    <div className="absolute inset-0" style={{ background: PALETTE.bg }}>
      <svg
        ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}`}
        className="block size-full select-none touch-none cursor-grab"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
      >
        <polygon points={scene.floor} fill="#f6f1e7" stroke="#f6f1e7" strokeWidth={1} />
        {scene.parts.map((p, i) => (p.kind === "face"
          ? <polygon key={i} points={p.points} fill={p.fill} fillOpacity={p.alpha} strokeLinejoin="round"
            stroke={p.picked ? PALETTE.accent : "rgba(0,0,0,.28)"} strokeWidth={p.picked ? 2 : 0.7} />
          : <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" fontSize={11} fill="#111" style={{ fontWeight: 600, pointerEvents: "none" }}>{p.text}</text>))}
      </svg>
      <p className="absolute left-3 bottom-3.5 text-sm text-gray-600 pointer-events-none font-normal">Dra för att vrida · scrolla eller nyp för att zooma · Shift-dra för att panorera</p>
      <div className="absolute right-3 bottom-3 flex gap-1.5">
        <button type="button" aria-label="Zooma ut" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom / 1.3, 0.4, 8) }))} className="min-w-10 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold">−</button>
        <button type="button" aria-label="Zooma in" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.3, 0.4, 8) }))} className="min-w-10 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold">+</button>
        <button type="button" onClick={() => setView((v) => ({ ...v, zoom: 1, px: 0, py: 0 }))} className="px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold text-sm">Visa allt</button>
      </div>
    </div>
  );
}
