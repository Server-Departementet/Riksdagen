import type { PlanData, Rect } from "@/lib/planner/plan";
import { backStrip, flatBox, inFlat, itemBox, stacking } from "@/lib/planner/geometry";

/*
 * The crude 3D view: everything is an upright box (or, drawn inside one, an upright cylinder). The camera is orthographic,
 * turned by `yaw` around the flat's centre and tilted `pitch` degrees down from
 * horizontal (90° would be the plan view).
 */

export type View3d = { yaw: number; pitch: number; zoom: number; px: number; py: number; wallH: number };

type Box3 = Rect & {
  z0: number; z1: number; color: string; top?: string; alpha?: number; id?: string; label?: string;
  /** Drawn as the elliptical cylinder inscribed in the box. It is still ordered as the box. */
  round?: boolean;
};
type Point = [number, number];

export type Face = {
  points: string; fill: string; alpha?: number; picked: boolean;
  /** Outline colour, for the strips of a curved surface, which must not show seams between them */
  edge?: string;
};
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

/** Sides of the polygon a cylinder's top is drawn as; even, so that the visible half of the side is a whole number of strips. */
const CYLINDER_SEGMENTS = 48;

/** What is left of a box once another is cut out of it: up to four boxes, none overlapping. */
function subtract(r: Rect, cut: Rect): Rect[] {
  const x0 = Math.max(r.x, cut.x), x1 = Math.min(r.x + r.w, cut.x + cut.w), y0 = Math.max(r.y, cut.y), y1 = Math.min(r.y + r.h, cut.y + cut.h);
  if (x0 >= x1 || y0 >= y1) return [r];
  return [
    { x: r.x, y: r.y, w: x0 - r.x, h: r.h }, { x: x1, y: r.y, w: r.x + r.w - x1, h: r.h },
    { x: x0, y: r.y, w: x1 - x0, h: y0 - r.y }, { x: x0, y: y1, w: x1 - x0, h: r.y + r.h - y1 },
  ].filter((p) => p.w > 0.05 && p.h > 0.05);
}
const without = (r: Rect, cuts: Rect[]): Rect[] => cuts.reduce((pieces, cut) => pieces.flatMap((p) => subtract(p, cut)), [r]);

/**
 * The same floor area as the given boxes, as boxes that don't overlap. Walls drawn by hand overlap at
 * corners and where one was dragged a little into another, and the drawing order below can only be
 * worked out for boxes that are apart: two that overlap have no right order, and a long wall then
 * ends up in front of, or behind, everything near it. The biggest boxes are kept whole.
 */
function apart(rects: Rect[]): Rect[] {
  const out: Rect[] = [];
  for (const r of [...rects].sort((a, b) => b.w * b.h - a.w * a.h)) out.push(...without(r, out));
  return out;
}

function boxes(plan: PlanData, wallH: number): Box3[] {
  const out: Box3[] = [];
  const wall = (r: Rect, z0: number, z1: number) => {
    if (z1 > z0 && r.w > 0 && r.h > 0) out.push({ ...r, z0, z1, color: "#d9d2c5", top: "#3a3733" });
  };
  /** A window opening: a parapet below, glass, and a lintel above (once the walls are tall enough). */
  const opening = (r: Rect, along: boolean, sill: number, head: number) => {
    wall(r, 0, Math.min(sill, wallH));
    wall(r, head, wallH);
    if (wallH <= sill) return;
    const glass: Rect = along ? { ...r, y: r.y + r.h / 2 - Math.min(3, r.h / 2), h: Math.min(6, r.h) } : { ...r, x: r.x + r.w / 2 - Math.min(3, r.w / 2), w: Math.min(6, r.w) };
    out.push({ ...glass, z0: sill, z1: Math.min(head, wallH), color: "#8fcdf0", alpha: 0.5 });
  };
  const touches = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const walls = apart(plan.walls);
  for (const w of walls) {
    // Cut the wall along its length wherever a window crosses it, leaving solid piers between the windows.
    const along = w.w >= w.h;
    const start = along ? w.x : w.y, end = start + (along ? w.w : w.h);
    const piece = (from: number, to: number): Rect => (along ? { x: from, y: w.y, w: to - from, h: w.h } : { x: w.x, y: from, w: w.w, h: to - from });
    const cuts = plan.windows
      .filter((win) => touches(win, w))
      .map((win) => ({ from: Math.max(start, along ? win.x : win.y), to: Math.min(end, along ? win.x + win.w : win.y + win.h), sill: win.sill, head: win.head }))
      .sort((a, b) => a.from - b.from);
    let edge = start;
    for (const cut of cuts) {
      if (cut.to <= edge) continue;
      const from = Math.max(cut.from, edge);
      wall(piece(edge, from), 0, wallH);
      opening(piece(from, cut.to), along, cut.sill, cut.head);
      edge = cut.to;
    }
    wall(piece(edge, end), 0, wallH);
  }
  // A window drawn in a gap between walls, rather than across one, stands on its own.
  for (const win of plan.windows) {
    for (const part of without(win, walls)) opening(part, win.w >= win.h, win.sill, win.head);
  }
  // Fittings drawn a little into a wall give way to it, for the same reason the walls are pulled apart.
  for (const f of plan.fixtures) {
    for (const part of without(f, [...walls, ...plan.windows])) out.push({ ...part, z0: 0, z1: f.height, color: "#f1ece2" });
  }
  const stack = stacking(plan);
  for (const it of plan.items) {
    if (!inFlat(plan, it)) continue;
    // Stacked pieces stand on whatever is under them.
    const b = itemBox(it), common = { color: it.color, id: it.id }, z = stack.z.get(it.id) ?? 0;
    // The models need some room for their parts; anything too small for that is drawn as a block.
    const roomy = it.h > 12 && Math.min(b.w, b.h) > 16;
    const corners = (r: Rect, t: number, inset: number): Rect[] =>
      [[r.x + inset, r.y + inset], [r.x + r.w - inset - t, r.y + inset], [r.x + inset, r.y + r.h - inset - t], [r.x + r.w - inset - t, r.y + r.h - inset - t]]
        .map(([x, y]) => ({ x: x as number, y: y as number, w: t, h: t }));
    if (it.model === "table" && roomy) {
      // A 4 cm top on four legs, so things can be seen (and placed) underneath.
      out.push({ ...b, z0: z + it.h - 4, z1: z + it.h, ...common, label: it.name });
      for (const leg of corners(b, 4, 2)) out.push({ ...leg, z0: z, z1: z + it.h - 4, ...common });
    }
    else if (it.model === "chair" && roomy && it.h > 30) {
      // Four legs, a seat a little over halfway up, and a backrest from the seat to the full height.
      const seat = z + Math.round(it.h * 0.53);
      for (const leg of corners(b, 4, 1)) out.push({ ...leg, z0: z, z1: seat - 4, ...common });
      out.push({ ...b, z0: seat - 4, z1: seat, ...common, label: it.name });
      out.push({ ...backStrip(b, it.a, 4), z0: seat, z1: z + it.h, ...common });
    }
    else if (it.model === "office-chair" && roomy && it.h > 40) {
      // A star base (drawn as a cross), a gas spring, a padded seat and a slightly narrower backrest.
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2, seat = z + Math.round(it.h * 0.45);
      const pad: Rect = { x: b.x + b.w * 0.08, y: b.y + b.h * 0.08, w: b.w * 0.84, h: b.h * 0.84 };
      // The cross in three parts that don't overlap, so the drawing order can be worked out.
      for (const bar of [{ x: b.x, y: cy - 3, w: b.w, h: 6 }, { x: cx - 3, y: b.y, w: 6, h: cy - 3 - b.y }, { x: cx - 3, y: cy + 3, w: 6, h: b.y + b.h - cy - 3 }]) {
        out.push({ ...bar, z0: z, z1: z + 6, ...common });
      }
      out.push({ x: cx - 3, y: cy - 3, w: 6, h: 6, z0: z + 6, z1: seat - 8, ...common });
      out.push({ ...pad, z0: seat - 8, z1: seat, ...common, label: it.name });
      out.push({ ...backStrip(pad, it.a, 5, pad.w * 0.08), z0: seat, z1: z + it.h, ...common });
    }
    // However low or small: a round rug is a centimetre high.
    else if (it.model === "cylinder") out.push({ ...b, z0: z, z1: z + it.h, ...common, label: it.name, round: true });
    else out.push({ ...b, z0: z, z1: z + it.h, ...common, label: it.name });
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
  /**
   * A cylinder: the half of its side that faces the camera, as strips shaded like a box's sides are
   * (0.8 where the surface faces along x, 0.64 along y, blended in between), then the outline of that
   * half and the top.
   */
  const cylinder = (b: Box3, picked: boolean): Face[] => {
    const rx = b.w / 2, ry = b.h / 2, cx = b.x + rx, cy = b.y + ry, half = CYLINDER_SEGMENTS / 2;
    // The side turns away from the camera where its normal, (ry cos t, rx sin t), is square to the view; `mid` is halfway between those two edges.
    const mid = Math.atan2(rx * cam[1], ry * cam[0]);
    const angle = (k: number) => mid - Math.PI / 2 + (k * Math.PI) / half;
    const at = (k: number, z: number) => P(cx + rx * Math.cos(angle(k)), cy + ry * Math.sin(angle(k)), z);
    const steps = (count: number) => Array.from({ length: count }, (_, k) => k);
    const faces: Face[] = steps(half).map((k) => {
      const t = angle(k + 0.5), nx = ry * Math.cos(t), ny = rx * Math.sin(t), fill = tint(b.color, (0.8 * nx * nx + 0.64 * ny * ny) / (nx * nx + ny * ny));
      return { points: pts([at(k, b.z0), at(k + 1, b.z0), at(k + 1, b.z1), at(k, b.z1)]), fill, edge: fill, picked: false };
    });
    faces.push({ points: pts([...steps(half + 1).map((k) => at(k, b.z0)), ...steps(half + 1).map((k) => at(half - k, b.z1))]), fill: "none", picked });
    faces.push({ points: pts(steps(CYLINDER_SEGMENTS).map((k) => at(k, b.z1))), fill: b.top ?? b.color, picked });
    return faces;
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
    if (b.round) for (const face of cylinder(b, picked)) scene.parts.push({ kind: "face", ...face });
    else for (const [q, fill] of faces) scene.parts.push({ kind: "face", points: pts(q), fill, picked, ...(b.alpha ? { alpha: b.alpha } : {}) });
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
