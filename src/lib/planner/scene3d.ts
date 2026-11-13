import type { PlanData, Rect } from "@/lib/planner/plan";
import { flatBox, inFlat, itemBox } from "@/lib/planner/geometry";

/*
 * The crude 3D view: everything is an upright box. The camera is orthographic,
 * turned by `yaw` around the flat's centre and tilted `pitch` degrees down from
 * horizontal (90° would be the plan view).
 */

export type View3d = { yaw: number; pitch: number; zoom: number; px: number; py: number; wallH: number };

type Box3 = Rect & { z0: number; z1: number; color: string; top?: string; alpha?: number; id?: string; label?: string };
type Point = [number, number];

export type Face = { points: string; fill: string; alpha?: number; picked: boolean };
export type Scene = {
  floor: string;
  /** Faces and labels in drawing order */
  parts: ({ kind: "face" } & Face | { kind: "label"; x: number; y: number; text: string })[];
  /** Everything drawn, before zoom and pan */
  frame: { minX: number; maxX: number; minY: number; maxY: number };
};

const tint = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.min(255, v * k))).join(",")})`;
};

function boxes(plan: PlanData, wallH: number): Box3[] {
  const out: Box3[] = [];
  const wall = (r: Rect, z0: number, z1: number) => {
    if (z1 > z0 && r.w > 0 && r.h > 0) out.push({ ...r, z0, z1, color: "#d9d2c5", top: "#3a3733" });
  };
  for (const w of plan.walls) {
    // Cut the wall along its length wherever a window crosses it: solid piers between the
    // windows, a parapet below each one, glass, and a lintel above (once the walls are tall enough).
    const along = w.w >= w.h;
    const start = along ? w.x : w.y, end = start + (along ? w.w : w.h);
    const piece = (from: number, to: number): Rect => (along ? { x: from, y: w.y, w: to - from, h: w.h } : { x: w.x, y: from, w: w.w, h: to - from });
    const cuts = plan.windows
      .filter((win) => win.x < w.x + w.w && win.x + win.w > w.x && win.y < w.y + w.h && win.y + win.h > w.y)
      .map((win) => ({ from: Math.max(start, along ? win.x : win.y), to: Math.min(end, along ? win.x + win.w : win.y + win.h), sill: win.sill, head: win.head }))
      .sort((a, b) => a.from - b.from);
    let edge = start;
    for (const cut of cuts) {
      if (cut.to <= edge) continue;
      const from = Math.max(cut.from, edge);
      wall(piece(edge, from), 0, wallH);
      wall(piece(from, cut.to), 0, Math.min(cut.sill, wallH));
      wall(piece(from, cut.to), cut.head, wallH);
      if (wallH > cut.sill) {
        const glass = piece(from, cut.to);
        const thin: Rect = along ? { ...glass, y: w.y + w.h / 2 - 3, h: 6 } : { ...glass, x: w.x + w.w / 2 - 3, w: 6 };
        out.push({ ...thin, z0: cut.sill, z1: Math.min(cut.head, wallH), color: "#8fcdf0", alpha: 0.5 });
      }
      edge = cut.to;
    }
    wall(piece(edge, end), 0, wallH);
  }
  for (const f of plan.fixtures) out.push({ x: f.x, y: f.y, w: f.w, h: f.h, z0: 0, z1: f.height, color: "#f1ece2" });
  for (const it of plan.items) {
    if (!inFlat(plan, it)) continue;
    const b = itemBox(it), common = { color: it.color, id: it.id };
    if (it.open && it.h > 12 && Math.min(b.w, b.h) > 16) {
      // Table-like: a 4 cm top on four legs, so things can be seen (and placed) underneath.
      out.push({ ...b, z0: it.h - 4, z1: it.h, ...common, label: it.name });
      for (const [lx, ly] of [[b.x + 2, b.y + 2], [b.x + b.w - 6, b.y + 2], [b.x + 2, b.y + b.h - 6], [b.x + b.w - 6, b.y + b.h - 6]] as Point[]) {
        out.push({ x: lx, y: ly, w: 4, h: 4, z0: 0, z1: it.h - 4, ...common });
      }
    }
    else out.push({ ...b, z0: 0, z1: it.h, ...common, label: it.name });
  }
  return out;
}

export function buildScene(plan: PlanData, view: View3d, selected: ReadonlySet<string>): Scene {
  const yaw = (view.yaw * Math.PI) / 180, pitch = (view.pitch * Math.PI) / 180;
  const cos = Math.cos(yaw), sin = Math.sin(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
  const flat = flatBox(plan), centreX = flat.x + flat.w / 2, centreY = flat.y + flat.h / 2;
  const P = (x: number, y: number, z: number): Point => {
    const dx = x - centreX, dy = y - centreY;
    return [dx * cos - dy * sin, (dx * sin + dy * cos) * sp - z * cp];
  };
  // Direction from the scene towards the camera, in flat coordinates.
  const cam = [cp * sin, cp * cos, sp] as const;
  const depth = (b: Box3) => (b.x + b.w / 2) * cam[0] + (b.y + b.h / 2) * cam[1] + ((b.z0 + b.z1) / 2) * cam[2];
  const all = boxes(plan, view.wallH);

  // Painter's order. If a plane separates two boxes and the camera is on B's side of it, A can
  // never hide B, so A may be drawn first. Boxes that interpenetrate fall back to centre depth.
  const span = (b: Box3) => [[b.x, b.x + b.w], [b.y, b.y + b.h], [b.z0, b.z1]] as const;
  const n = all.length;
  const after: number[][] = all.map(() => []), waiting: number[] = all.map(() => 0);
  const depths = all.map(depth);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = span(all[i] as Box3), B = span(all[j] as Box3);
    let iFirst = false, jFirst = false, apart = false;
    for (const k of [0, 1, 2] as const) {
      if (A[k][1] <= B[k][0] + 0.01) { apart = true; if (cam[k] > 1e-9) iFirst = true; else if (cam[k] < -1e-9) jFirst = true; }
      else if (B[k][1] <= A[k][0] + 0.01) { apart = true; if (cam[k] > 1e-9) jFirst = true; else if (cam[k] < -1e-9) iFirst = true; }
    }
    if (!apart) { if ((depths[i] as number) <= (depths[j] as number)) iFirst = true; else jFirst = true; }
    if (iFirst && !jFirst) { (after[i] as number[]).push(j); (waiting[j] as number)++; }
    else if (jFirst && !iFirst) { (after[j] as number[]).push(i); (waiting[i] as number)++; }
  }
  const order: number[] = [], left = new Set(all.keys());
  const farther = (i: number, pick: number) => pick < 0 || (depths[i] as number) < (depths[pick] as number);
  while (left.size) {
    let pick = -1;
    for (const i of left) if (waiting[i] === 0 && farther(i, pick)) pick = i;
    if (pick < 0) for (const i of left) if (farther(i, pick)) pick = i; // cycle: farthest first
    left.delete(pick); order.push(pick);
    for (const j of after[pick] ?? []) (waiting[j] as number)--;
  }

  const seen: Point[] = [];
  const pts = (q: Point[]) => { seen.push(...q); return q.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "); };
  const scene: Scene = {
    floor: pts([P(flat.x, flat.y, 0), P(flat.x + flat.w, flat.y, 0), P(flat.x + flat.w, flat.y + flat.h, 0), P(flat.x, flat.y + flat.h, 0)]),
    parts: [], frame: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };
  for (const i of order) {
    const b = all[i] as Box3, x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.h;
    const picked = !!b.id && selected.has(b.id);
    const xf = cam[0] > 0 ? x1 : x0, yf = cam[1] > 0 ? y1 : y0;
    const faces: [Point[], string][] = [
      [[P(xf, y0, b.z0), P(xf, y1, b.z0), P(xf, y1, b.z1), P(xf, y0, b.z1)], tint(b.color, 0.8)],
      [[P(x0, yf, b.z0), P(x1, yf, b.z0), P(x1, yf, b.z1), P(x0, yf, b.z1)], tint(b.color, 0.64)],
      [[P(x0, y0, b.z1), P(x1, y0, b.z1), P(x1, y1, b.z1), P(x0, y1, b.z1)], b.top ?? b.color],
    ];
    for (const [q, fill] of faces) scene.parts.push({ kind: "face", points: pts(q), fill, picked, ...(b.alpha ? { alpha: b.alpha } : {}) });
    if (b.label && Math.max(b.w, b.h) >= 40) {
      const [tx, ty] = P((x0 + x1) / 2, (y0 + y1) / 2, b.z1);
      scene.parts.push({ kind: "label", x: tx, y: ty + 4, text: b.label });
    }
  }
  const xs = seen.map((p) => p[0]), ys = seen.map((p) => p[1]);
  scene.frame = { minX: Math.min(...xs) - 30, maxX: Math.max(...xs) + 30, minY: Math.min(...ys) - 30, maxY: Math.max(...ys) + 30 };
  return scene;
}

/** The view box that frames the scene in an element of the given aspect, with zoom and pan applied around the frame's centre. */
export function sceneViewBox(scene: Scene, view: View3d, aspect: number): Rect {
  const { minX, maxX, minY, maxY } = scene.frame;
  let w = maxX - minX, h = maxY - minY;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  w /= view.zoom; h /= view.zoom;
  return { x: (minX + maxX) / 2 - w / 2 + view.px, y: (minY + maxY) / 2 - h / 2 + view.py, w, h };
}
