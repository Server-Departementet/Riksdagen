"use client";

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { Dim, Fixture, Item, Label, PlanData, PlanWindow, Rect } from "@/lib/planner/plan";
import { DEFAULT_HEAD, DEFAULT_SILL, areaText, clamp, uid } from "@/lib/planner/plan";
import type { Guide } from "@/lib/planner/geometry";
import {
  backStrip, bounds, dimLength, drawingBox, fitWindowToWall, flatBox, gaps, groupOf, imageRect, inFlat, isHit, itemBox, obstacles,
  parkBox, rectFrom, snapBox, snapPoint, snapTolerance, stacking,
} from "@/lib/planner/geometry";
import type { StaticElement, StaticKind, StaticRef } from "@/lib/planner/edit";
import { findStatic, patchStatic } from "@/lib/planner/edit";
import { imageUrl } from "@/lib/planner/client-store";

export type Mode = "furnish" | "draw";
export type Tool = "select" | "wall" | "window" | "fixture" | "dim" | "label" | "scale" | "area";
export type Line = { x1: number; y1: number; x2: number; y2: number };
export type ViewOptions = { snap: boolean; dims: boolean; gaps: boolean; overlay: boolean; overlayOpacity: number; multi: boolean };

/** How the stage changes the plan. The planner owns the plan, its undo history and saving. */
export type Editor = {
  /** Remember the plan as it is now, for undo. Call once before a change, or when a drag first moves. */
  checkpoint: () => void;
  /** Replace the plan. `save: false` while a drag is still going. */
  setPlan: (next: PlanData, save: boolean) => void;
  /** Save the plan as it stands, after a drag. */
  save: () => void;
};

export const PALETTE = {
  bg: "#f4f1ec", floor: "#fffdf8", wall: "#2b2926", fix: "#e3ddd2", fixLine: "#8c857a", dim: "#2a6f97", win: "#7cc0e8",
  bad: "#d92d20", gap: "#0f7b4f", accent: "#c2410c", muted: "#6b655c", text: "#1d1b18", line: "#dcd5ca",
} as const;
const C = PALETTE;

const STATIC_KINDS: StaticKind[] = ["walls", "windows", "fixtures", "dims", "labels"];
type Handle = "nw" | "ne" | "sw" | "se" | "p1" | "p2";
type Drag =
  | { kind: "pan"; x: number; y: number; moved: boolean }
  | { kind: "items"; ids: Set<string>; start: Map<string, { x: number; y: number }>; bx: number; by: number; w: number; h: number; dx: number; dy: number; moved: boolean }
  | { kind: "move"; ref: StaticRef; start: StaticElement; px: number; py: number; moved: boolean }
  | { kind: "resize"; ref: StaticRef; start: StaticElement; handle: Handle; moved: boolean }
  | { kind: "draw"; tool: Exclude<Tool, "select" | "scale">; ax: number; ay: number }
  | { kind: "scale"; ax: number; ay: number };
type Draft = { kind: "rect"; r: Rect } | { kind: "line"; l: Line };

const isDim = (el: StaticElement): el is Dim => "x1" in el;
const isBox = (el: StaticElement): el is Exclude<StaticElement, Dim | Label> => "w" in el;
const horizontal = (l: Line) => Math.abs(l.x2 - l.x1) >= Math.abs(l.y2 - l.y1);
/** The end point moved onto the start point's row or column, whichever is closer. */
const straight = (ax: number, ay: number, x: number, y: number) => (Math.abs(x - ax) >= Math.abs(y - ay) ? { x, y: ay } : { x: ax, y });

export function Stage(
  {
    planId, plan, readOnly, mode, tool, hidden, sel, onSelect, staticSel, onSelectStatic, opts, editor, scaleLine, onScaleLine, scaleAreas, onScaleAreas, svgRef,
  }: {
    planId: string;
    plan: PlanData;
    readOnly: boolean;
    mode: Mode;
    tool: Tool;
    /** The 3D view is showing instead */
    hidden: boolean;
    sel: ReadonlySet<string>;
    onSelect: (ids: string[]) => void;
    staticSel: StaticRef | null;
    onSelectStatic: (ref: StaticRef | null) => void;
    opts: ViewOptions;
    editor: Editor;
    /** The known distance marked on the image, waiting for its real length */
    scaleLine: Line | null;
    onScaleLine: (line: Line | null) => void;
    /** The floor marked out with the area tool, waiting for its real size */
    scaleAreas: Rect[];
    onScaleAreas: (areas: Rect[]) => void;
    svgRef: RefObject<SVGSVGElement | null>;
  },
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState({ cx: 300, cy: 300, scale: 1 }); // scale = screen px per cm
  const [guides, setGuides] = useState<Guide[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<Drag | null>(null);
  const pinch = useRef<number | null>(null);
  const fitted = useRef(false);
  const space = useRef(false);

  useEffect(() => {
    // Space held = pan with the left button. Left alone while typing or when a button has focus, where Space means something else.
    const busy = (evt: KeyboardEvent) => !!(evt.target as Element | null)?.matches?.("input, textarea, select, button");
    const down = (evt: KeyboardEvent) => {
      if (evt.code !== "Space" || busy(evt)) return;
      evt.preventDefault(); // the page would scroll
      space.current = true;
    };
    const up = (evt: KeyboardEvent) => { if (evt.code === "Space") space.current = false; };
    const blur = () => { space.current = false; };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { document.removeEventListener("keydown", down); document.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  const fitView = (box: { w: number; h: number }) => {
    // The image only counts while it is being traced or is all there is.
    const b = drawingBox(plan, mode === "draw" || plan.walls.length === 0);
    const park = parkBox(plan), showPark = !readOnly || plan.items.some((i) => !inFlat(plan, i));
    const all = bounds(showPark ? [b, park] : [b]) ?? b;
    const m = 30;
    return { scale: clamp(Math.min(box.w / (all.w + 2 * m), box.h / (all.h + 2 * m)), 0.15, 8), cx: all.x + all.w / 2, cy: all.y + all.h / 2 };
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Frame the whole plan once, as soon as the stage knows how big it is.
  useEffect(() => {
    if (!size || fitted.current) return;
    fitted.current = true;
    setView(fitView(size));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the first measured size
  }, [size]);

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const ox = clientX - r.left - r.width / 2, oy = clientY - r.top - r.height / 2;
    // Keep the point under the cursor fixed while zooming.
    setView((v) => {
      const scale = clamp(v.scale * factor, 0.15, 8);
      return { scale, cx: v.cx + ox / v.scale - ox / scale, cy: v.cy + oy / v.scale - oy / scale };
    });
  };
  const zoomCentre = (factor: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // React's onWheel is passive, and the page must not scroll while zooming.
    const onWheel = (evt: WheelEvent) => {
      evt.preventDefault();
      const r = svg.getBoundingClientRect();
      const ox = evt.clientX - r.left - r.width / 2, oy = evt.clientY - r.top - r.height / 2, factor = Math.exp(-evt.deltaY * 0.0015);
      setView((v) => {
        const scale = clamp(v.scale * factor, 0.15, 8);
        return { scale, cx: v.cx + ox / v.scale - ox / scale, cy: v.cy + oy / v.scale - oy / scale };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [svgRef]);

  const world = (evt: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
    return { x: view.cx + (evt.clientX - r.left - r.width / 2) / view.scale, y: view.cy + (evt.clientY - r.top - r.height / 2) / view.scale };
  };

  const tol = snapTolerance(view.scale);
  /** Everything drawn that an edge can snap to, except one element. */
  const snapTargets = (skip?: string): Rect[] => [...plan.walls, ...plan.fixtures, ...plan.windows].filter((r) => r.id !== skip);
  const snapAt = (p: { x: number; y: number }, free: boolean, skip?: string) =>
    (opts.snap && !free ? snapPoint(snapTargets(skip), p.x, p.y, tol) : { x: Math.round(p.x), y: Math.round(p.y), guides: [] });

  function onPointerDown(evt: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    try { evt.currentTarget.setPointerCapture(evt.pointerId); }
    catch { /* synthetic events have no capturable pointer */ }
    if (pointers.current.size === 2) { // second finger: switch to pinch-zoom
      const d = drag.current;
      if (d && "moved" in d && d.moved && d.kind !== "pan") editor.save();
      drag.current = null; setGuides([]); setDraft(null);
      const [a, b] = [...pointers.current.values()];
      if (a && b) pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
      return;
    }
    const target = evt.target as Element, p = world(evt);
    const pan = () => { drag.current = { kind: "pan", x: evt.clientX, y: evt.clientY, moved: false }; };

    // The middle or right button, or the left one with Space held, always moves the view, whatever tool
    // is active. Marked as moved from the start so that letting go doesn't count as a click on empty floor.
    if (evt.button === 1 || evt.button === 2 || space.current) {
      drag.current = { kind: "pan", x: evt.clientX, y: evt.clientY, moved: true };
      return;
    }

    if (mode === "draw" && !readOnly) {
      if (tool === "scale") {
        drag.current = { kind: "scale", ax: p.x, ay: p.y };
        onScaleLine(null);
        return;
      }
      if (tool !== "select") {
        const s = snapAt(p, evt.altKey);
        drag.current = { kind: "draw", tool, ax: s.x, ay: s.y };
        return;
      }
      const handle = target.closest("[data-handle]")?.getAttribute("data-handle") as Handle | null | undefined;
      const picked = findStatic(plan, staticSel);
      if (handle && staticSel && picked) {
        drag.current = { kind: "resize", ref: staticSel, start: picked, handle, moved: false };
        return;
      }
      const [kind, id] = (target.closest("[data-static]")?.getAttribute("data-static") ?? "").split(":");
      const ref = STATIC_KINDS.find((k) => k === kind) && id ? { kind: kind as StaticKind, id } : null;
      const el = findStatic(plan, ref);
      if (ref && el) {
        onSelectStatic(ref);
        drag.current = { kind: "move", ref, start: el, px: p.x, py: p.y, moved: false };
        return;
      }
      pan();
      return;
    }

    const it = plan.items.find((i) => i.id === target.closest("[data-id]")?.getAttribute("data-id"));
    if (!it) { pan(); return; }
    // Clicking any member picks up its whole group.
    const members = groupOf(plan.items, it).map((i) => i.id);
    let next = new Set(sel);
    if (evt.shiftKey || evt.ctrlKey || evt.metaKey || opts.multi) {
      const allIn = members.every((m) => next.has(m));
      for (const m of members) { if (allIn) next.delete(m); else next.add(m); }
      onSelect([...next]);
      if (allIn) return; // just removed from the selection: nothing to drag
    }
    else if (!sel.has(it.id)) {
      next = new Set(members);
      onSelect(members);
    }
    if (readOnly) return;
    const list = plan.items.filter((i) => next.has(i.id)), b = bounds(list.map(itemBox));
    if (!b) return;
    drag.current = {
      kind: "items", ids: next, start: new Map(list.map((i) => [i.id, { x: i.x, y: i.y }])),
      bx: b.x, by: b.y, w: b.w, h: b.h, dx: b.x - p.x, dy: b.y - p.y, moved: false,
    };
  }

  function onPointerMove(evt: ReactPointerEvent<SVGSVGElement>) {
    const last = pointers.current.get(evt.pointerId);
    if (!last) return;
    pointers.current.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    if (pinch.current !== null && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinch.current);
      pinch.current = dist;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const p = world(evt);
    switch (d.kind) {
      case "pan": {
        const dx = evt.clientX - d.x, dy = evt.clientY - d.y;
        if (dx || dy) d.moved = true;
        d.x = evt.clientX; d.y = evt.clientY;
        setView((v) => ({ ...v, cx: v.cx - dx / v.scale, cy: v.cy - dy / v.scale }));
        break;
      }
      case "items": {
        if (!d.moved) { editor.checkpoint(); d.moved = true; }
        // Snap the selection's outline, then shift every piece by the same amount.
        const x = p.x + d.dx, y = p.y + d.dy;
        const pos = opts.snap && !evt.altKey
          ? snapBox(d, obstacles(plan, plan.items.filter((i) => d.ids.has(i.id))), x, y, tol)
          : { x: Math.round(x), y: Math.round(y), guides: [] };
        setGuides(pos.guides);
        editor.setPlan({
          ...plan,
          items: plan.items.map((i) => {
            const s = d.start.get(i.id);
            return s ? { ...i, x: s.x + pos.x - d.bx, y: s.y + pos.y - d.by } : i;
          }),
        }, false);
        break;
      }
      case "move": {
        if (!d.moved) { editor.checkpoint(); d.moved = true; }
        const dx = p.x - d.px, dy = p.y - d.py, el = d.start;
        if (isDim(el)) {
          const rx = Math.round(dx), ry = Math.round(dy);
          editor.setPlan(patchStatic(plan, d.ref, { x1: el.x1 + rx, y1: el.y1 + ry, x2: el.x2 + rx, y2: el.y2 + ry }), false);
        }
        else if (isBox(el)) {
          const pos = opts.snap && !evt.altKey ? snapBox(el, snapTargets(el.id), el.x + dx, el.y + dy, tol) : { x: Math.round(el.x + dx), y: Math.round(el.y + dy), guides: [] };
          setGuides(pos.guides);
          editor.setPlan(patchStatic(plan, d.ref, { x: pos.x, y: pos.y }), false);
        }
        else editor.setPlan(patchStatic(plan, d.ref, { x: Math.round(el.x + dx), y: Math.round(el.y + dy) }), false);
        break;
      }
      case "resize": {
        if (!d.moved) { editor.checkpoint(); d.moved = true; }
        const el = d.start, s = snapAt(p, evt.altKey, el.id);
        setGuides(s.guides);
        if (isDim(el)) {
          // The other end stays put; the line stays horizontal or vertical.
          const [fx, fy] = d.handle === "p1" ? [el.x2, el.y2] : [el.x1, el.y1];
          const end = straight(fx, fy, s.x, s.y);
          editor.setPlan(patchStatic(plan, d.ref, d.handle === "p1" ? { x1: end.x, y1: end.y } : { x2: end.x, y2: end.y }), false);
        }
        else if (isBox(el)) {
          // The opposite corner stays put.
          const fx = d.handle === "nw" || d.handle === "sw" ? el.x + el.w : el.x, fy = d.handle === "nw" || d.handle === "ne" ? el.y + el.h : el.y;
          const r = rectFrom(fx, fy, s.x, s.y);
          editor.setPlan(patchStatic(plan, d.ref, { x: r.x, y: r.y, w: Math.max(1, r.w), h: Math.max(1, r.h) }), false);
        }
        break;
      }
      case "draw": {
        if (d.tool === "label") break;
        const s = snapAt(p, evt.altKey);
        setGuides(s.guides);
        if (d.tool === "dim") {
          const end = straight(d.ax, d.ay, s.x, s.y);
          setDraft({ kind: "line", l: { x1: d.ax, y1: d.ay, x2: end.x, y2: end.y } });
        }
        else setDraft({ kind: "rect", r: rectFrom(d.ax, d.ay, s.x, s.y) });
        break;
      }
      case "scale":
        setDraft({ kind: "line", l: { x1: d.ax, y1: d.ay, x2: p.x, y2: p.y } });
        break;
    }
  }

  function onPointerEnd(evt: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.delete(evt.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    setGuides([]); setDraft(null);
    if (!d || evt.type !== "pointerup") {
      if (d && "moved" in d && d.moved && d.kind !== "pan") editor.save();
      return;
    }
    const p = world(evt);
    switch (d.kind) {
      case "pan":
        // A plain click on empty floor clears the selection; dragging the view around keeps it.
        if (!d.moved) { if (sel.size) onSelect([]); if (staticSel) onSelectStatic(null); }
        break;
      case "items": case "move": case "resize":
        if (d.moved) editor.save();
        break;
      case "scale": {
        const l = { x1: d.ax, y1: d.ay, x2: p.x, y2: p.y };
        if (Math.hypot(l.x2 - l.x1, l.y2 - l.y1) * view.scale > 12) onScaleLine(l);
        break;
      }
      case "draw": {
        const s = snapAt(p, evt.altKey), id = uid();
        const add = (kind: StaticKind, next: PlanData) => { editor.checkpoint(); editor.setPlan(next, true); onSelectStatic({ kind, id }); };
        if (d.tool === "label") { add("labels", { ...plan, labels: [...plan.labels, { id, x: d.ax, y: d.ay, text: "Rum" }] }); break; }
        if (d.tool === "dim") {
          const end = straight(d.ax, d.ay, s.x, s.y), l = { x1: d.ax, y1: d.ay, x2: end.x, y2: end.y };
          if (dimLength(l) >= 5) add("dims", { ...plan, dims: [...plan.dims, { id, ...l, text: "", flip: false }] });
          break;
        }
        const r = rectFrom(d.ax, d.ay, s.x, s.y);
        if (r.w < 2 || r.h < 2) break;
        if (d.tool === "area") { onScaleAreas([...scaleAreas, r]); break; }
        if (d.tool === "wall") add("walls", { ...plan, walls: [...plan.walls, { id, ...r }] });
        else if (d.tool === "fixture") add("fixtures", { ...plan, fixtures: [...plan.fixtures, { id, ...r, label: "", height: 210 }] });
        else add("windows", { ...plan, windows: [...plan.windows, { id, ...fitWindowToWall(r, plan.walls), sill: DEFAULT_SILL, head: DEFAULT_HEAD }] });
        break;
      }
    }
  }

  const px = 1 / view.scale; // one screen pixel, in cm
  const drawing = mode === "draw" && !readOnly;
  const stack = stacking(plan);
  const chosen = plan.items.filter((i) => sel.has(i.id));
  const chosenBox = bounds(chosen.map(itemBox));
  const flat = flatBox(plan), park = parkBox(plan), image = imageRect(plan);
  const showPark = !readOnly || plan.items.some((i) => !inFlat(plan, i));
  const picked = drawing ? findStatic(plan, staticSel) : null;
  // The stated area goes under the whole drawing, measurements included, so it never lands on the flat. Exports
  // frame the same box with a margin this line fits in.
  const frame = drawingBox(plan, false);
  const viewBox = size
    ? `${view.cx - size.w / 2 / view.scale} ${view.cy - size.h / 2 / view.scale} ${size.w / view.scale} ${size.h / view.scale}`
    : "0 0 100 100";
  const cursor = drawing && tool !== "select" ? "crosshair" : "grab";
  // Drawn things only react to the pointer while the plan itself is being edited.
  const staticProps = (kind: StaticKind, id: string) => (drawing && tool === "select" ? { "data-static": `${kind}:${id}`, style: { cursor: "move" } } : {});

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ display: hidden ? "none" : "block", background: C.bg }}>
      <svg
        ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}
        className="block size-full select-none touch-none" style={{ cursor }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
        // The middle button would start the browser's auto-scroll and the right one open its menu; both pan here.
        onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }} onContextMenu={(e) => e.preventDefault()}
      >
        {/* The plan itself */}
        <g>
          {plan.walls.length > 0 && <rect x={flat.x} y={flat.y} width={flat.w} height={flat.h} fill={C.floor} />}
          {plan.walls.map((w) => <rect key={w.id} x={w.x} y={w.y} width={w.w} height={w.h} fill={C.wall} {...staticProps("walls", w.id)} />)}
          {plan.windows.map((w) => <WindowShape key={w.id} win={w} hit={staticProps("windows", w.id)} />)}
          {plan.fixtures.map((f) => <FixtureShape key={f.id} fixture={f} hit={staticProps("fixtures", f.id)} />)}
          {plan.labels.map((l) => (
            <text key={l.id} x={l.x} y={l.y} textAnchor="middle" fontSize={14} fill={C.text} {...staticProps("labels", l.id)}
              style={{ fontWeight: 600, ...(drawing && tool === "select" ? { cursor: "move" } : { pointerEvents: "none" }) }}>{l.text}</text>
          ))}
          {plan.area !== undefined && (
            <text x={frame.x} y={frame.y + frame.h + 15} fontSize={12} fill={C.muted} style={{ fontWeight: 400, pointerEvents: "none" }}>Boarea {areaText(plan.area)}</text>
          )}
        </g>

        {showPark && <g data-noexport="">
          <rect x={park.x} y={park.y} width={park.w} height={park.h} rx={14} fill="none" stroke={C.line} strokeWidth={1.5} strokeDasharray="8 6" />
          <text x={park.x + 12} y={park.y - 8} fontSize={12} fill={C.muted} style={{ fontWeight: 400, pointerEvents: "none" }}>Inte utplacerat än</text>
        </g>}

        {opts.dims && <g>{plan.dims.map((d) => <DimShape key={d.id} dim={d} hit={staticProps("dims", d.id)} />)}</g>}

        {image && plan.image && (opts.overlay || drawing) && (
          <image data-noexport="" href={imageUrl(planId, plan.image.rev)} x={image.x} y={image.y} width={image.w} height={image.h}
            opacity={opts.overlayOpacity / 100} preserveAspectRatio="none" style={{ pointerEvents: "none" }} />
        )}

        {/* Furniture, selected pieces last so they draw on top */}
        <g data-furniture="" style={drawing ? { pointerEvents: "none", opacity: 0.45 } : undefined}>
          {[...plan.items].sort((a, b) => Number(sel.has(a.id)) - Number(sel.has(b.id))).map((it) => (
            <ItemShape key={it.id} item={it} parked={!inFlat(plan, it)} movable={!readOnly} />
          ))}
        </g>

        {/* Everything that is about editing rather than the plan: left out of exports */}
        <g data-noexport="" style={{ pointerEvents: "none" }}>
          {!drawing && plan.items.map((it) => ({ it, hit: isHit(plan, it, stack) })).filter(({ it, hit }) => hit || sel.has(it.id)).map(({ it, hit }) => {
            const b = itemBox(it);
            return <rect key={it.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="none"
              stroke={hit ? C.bad : C.text} strokeWidth={hit ? 3.5 : 3} strokeDasharray={hit ? "7 4" : undefined} />;
          })}
          {guides.map((g, i) => ("v" in g
            ? <line key={i} x1={g.v} x2={g.v} y1={view.cy - 5000} y2={view.cy + 5000} stroke={C.accent} strokeWidth={px} strokeDasharray={`${4 * px} ${4 * px}`} />
            : <line key={i} y1={g.h} y2={g.h} x1={view.cx - 5000} x2={view.cx + 5000} stroke={C.accent} strokeWidth={px} strokeDasharray={`${4 * px} ${4 * px}`} />))}
          {!drawing && chosen.length > 1 && chosenBox && (
            <rect x={chosenBox.x - 4 * px} y={chosenBox.y - 4 * px} width={chosenBox.w + 8 * px} height={chosenBox.h + 8 * px}
              fill="none" stroke={C.accent} strokeWidth={1.5 * px} strokeDasharray={`${6 * px} ${4 * px}`} />
          )}
          {!drawing && chosenBox && opts.gaps && gaps(chosenBox, obstacles(plan, chosen)).map((g, i) => {
            const flatLine = g.y1 === g.y2, mx = (g.x1 + g.x2) / 2, my = (g.y1 + g.y2) / 2, t = 5 * px;
            return <g key={i}>
              <path fill="none" stroke={C.gap} strokeWidth={1.5 * px} d={`M${g.x1} ${g.y1}L${g.x2} ${g.y2}` + (flatLine
                ? `M${g.x1} ${g.y1 - t}v${2 * t}M${g.x2} ${g.y2 - t}v${2 * t}`
                : `M${g.x1 - t} ${g.y1}h${2 * t}M${g.x2 - t} ${g.y2}h${2 * t}`)} />
              <text x={flatLine ? mx : mx + 6 * px} y={flatLine ? my - 5 * px : my + 4 * px} textAnchor={flatLine ? "middle" : "start"}
                fontSize={13 * px} fill={C.gap} stroke={C.floor} strokeWidth={3 * px} paintOrder="stroke" style={{ fontWeight: 700 }}>{g.len}</text>
            </g>;
          })}
          {draft?.kind === "rect" && <rect x={draft.r.x} y={draft.r.y} width={draft.r.w} height={draft.r.h} fill={C.accent} fillOpacity={0.25} stroke={C.accent} strokeWidth={1.5 * px} />}
          {draft?.kind === "line" && <MeasureLine line={draft.l} px={px} label={tool === "dim" ? String(dimLength(draft.l)) : ""} />}
          {drawing && scaleLine && <MeasureLine line={scaleLine} px={px} label="?" />}
          {drawing && tool === "area" && scaleAreas.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={C.gap} fillOpacity={0.3} stroke={C.gap} strokeWidth={1.5 * px} />
          ))}
        </g>

        {/* Handles of the selected drawn thing */}
        {picked && tool === "select" && <g data-noexport="">
          {isDim(picked)
            ? ([["p1", picked.x1, picked.y1], ["p2", picked.x2, picked.y2]] as const).map(([h, x, y]) => (
              <circle key={h} data-handle={h} cx={x} cy={y} r={6 * px} fill="#fff" stroke={C.accent} strokeWidth={2 * px} style={{ cursor: "pointer" }} />
            ))
            : isBox(picked)
              ? <>
                <rect x={picked.x} y={picked.y} width={picked.w} height={picked.h} fill="none" stroke={C.accent} strokeWidth={2 * px} style={{ pointerEvents: "none" }} />
                {([["nw", 0, 0], ["ne", 1, 0], ["sw", 0, 1], ["se", 1, 1]] as const).map(([h, fx, fy]) => (
                  <rect key={h} data-handle={h} x={picked.x + fx * picked.w - 5 * px} y={picked.y + fy * picked.h - 5 * px} width={10 * px} height={10 * px}
                    fill="#fff" stroke={C.accent} strokeWidth={2 * px} style={{ cursor: fx === fy ? "nwse-resize" : "nesw-resize" }} />
                ))}
              </>
              : <circle cx={picked.x} cy={picked.y + 8 * px} r={3 * px} fill={C.accent} style={{ pointerEvents: "none" }} />}
        </g>}
      </svg>

      <div className="absolute right-3 bottom-3 flex gap-1.5">
        <button type="button" aria-label="Zooma ut" onClick={() => zoomCentre(1 / 1.3)} className="min-w-10 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold">−</button>
        <button type="button" aria-label="Zooma in" onClick={() => zoomCentre(1.3)} className="min-w-10 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold">+</button>
        <button type="button" onClick={() => size && setView(fitView(size))} className="px-2.5 py-1.5 rounded-md border border-gray-300 bg-white shadow font-semibold text-sm">Visa allt</button>
      </div>
    </div>
  );
}

type HitProps = { "data-static"?: string; style?: { cursor: string } };

function WindowShape({ win, hit }: { win: PlanWindow; hit: HitProps }) {
  const along = win.w >= win.h, thick = clamp((along ? win.h : win.w) * 0.45, 3, 9);
  return <g {...hit}>
    <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="transparent" />
    {along
      ? <line x1={win.x} x2={win.x + win.w} y1={win.y + win.h / 2} y2={win.y + win.h / 2} stroke={C.win} strokeWidth={thick} />
      : <line y1={win.y} y2={win.y + win.h} x1={win.x + win.w / 2} x2={win.x + win.w / 2} stroke={C.win} strokeWidth={thick} />}
  </g>;
}

function FixtureShape({ fixture: f, hit }: { fixture: Fixture; hit: HitProps }) {
  const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
  // A long label in a tall, narrow unit reads better turned on its side.
  const turned = f.h > f.w && f.label.length * 7 > f.w;
  return <g {...hit}>
    <rect x={f.x} y={f.y} width={f.w} height={f.h} fill={C.fix} stroke={C.fixLine} strokeWidth={1} />
    {f.label && <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill={C.muted} transform={turned ? `rotate(-90 ${cx} ${cy})` : undefined}
      style={{ fontWeight: 400, pointerEvents: "none" }}>{f.label}</text>}
  </g>;
}

function DimShape({ dim: d, hit }: { dim: Dim; hit: HitProps }) {
  const label = d.text || String(dimLength(d));
  const flatLine = horizontal(d);
  const path = flatLine
    ? `M${d.x1} ${d.y1}H${d.x2}M${d.x1} ${d.y1 - 6}v12M${d.x2} ${d.y1 - 6}v12`
    : `M${d.x1} ${d.y1}V${d.y2}M${d.x1 - 6} ${d.y1}h12M${d.x1 - 6} ${d.y2}h12`;
  const tx = flatLine ? (d.x1 + d.x2) / 2 : (d.flip ? d.x1 - 6 : d.x1 + 14);
  const ty = flatLine ? (d.flip ? d.y1 + 14 : d.y1 - 5) : (d.y1 + d.y2) / 2;
  return <g {...hit}>
    {hit["data-static"] && <path d={path} fill="none" stroke="transparent" strokeWidth={16} />}
    <path d={path} fill="none" stroke={C.dim} strokeWidth={1.2} />
    <text x={tx} y={ty} textAnchor="middle" fontSize={12.5} fill={C.dim} transform={flatLine ? undefined : `rotate(-90 ${tx} ${ty})`}
      style={{ fontWeight: 600, pointerEvents: "none" }}>{label}</text>
  </g>;
}

function MeasureLine({ line: l, px, label }: { line: Line; px: number; label: string }) {
  return <g>
    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={C.accent} strokeWidth={2 * px} />
    <circle cx={l.x1} cy={l.y1} r={4 * px} fill={C.accent} />
    <circle cx={l.x2} cy={l.y2} r={4 * px} fill={C.accent} />
    {label && <text x={(l.x1 + l.x2) / 2} y={(l.y1 + l.y2) / 2 - 8 * px} textAnchor="middle" fontSize={14 * px} fill={C.accent}
      stroke="#fff" strokeWidth={3 * px} paintOrder="stroke" style={{ fontWeight: 700 }}>{label}</text>}
  </g>;
}

function ItemShape({ item: it, parked, movable }: { item: Item; parked: boolean; movable: boolean }) {
  const b = itemBox(it), small = Math.min(b.w, b.h) < 42, upright = b.h > b.w && b.w < 70;
  // Shrink the label until the name fits along the piece's long side.
  const room = upright ? b.h : b.w;
  const fs = clamp(room / (Math.max(it.name.length, 5) * 0.62), 6, small ? 10 : 12);
  // Chairs show which way they face: a darker band along the backrest.
  const back = it.model === "chair" || it.model === "office-chair" ? backStrip({ x: -b.w / 2, y: -b.h / 2, w: b.w, h: b.h }, it.a, Math.min(7, Math.min(b.w, b.h) / 4), 1.5) : null;
  return (
    <g data-id={it.id} {...(parked ? { "data-noexport": "" } : {})} transform={`translate(${it.x} ${it.y})`} style={{ cursor: movable ? "move" : "pointer" }}>
      <rect x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} rx={3} fill={it.color} fillOpacity={0.82} stroke={C.text} strokeWidth={1.5} />
      {back && <rect x={back.x} y={back.y} width={back.w} height={back.h} rx={1.5} fill="#000" fillOpacity={0.3} style={{ pointerEvents: "none" }} />}
      <g transform={upright ? "rotate(-90)" : undefined} style={{ pointerEvents: "none" }}>
        <text textAnchor="middle" y={-1} fontSize={fs} fill="#111" style={{ fontWeight: 600 }}>{it.name}</text>
        <text textAnchor="middle" y={fs} fontSize={fs - 1} fill="#111" style={{ fontWeight: 400 }}>{it.w}×{it.d}</text>
      </g>
    </g>
  );
}
