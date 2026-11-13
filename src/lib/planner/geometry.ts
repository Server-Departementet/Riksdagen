import type { Dim, Item, PlanData, Rect } from "@/lib/planner/plan";
import { clamp } from "@/lib/planner/plan";

/** A vertical (`v`, an x position) or horizontal (`h`, a y position) snapping guide. */
export type Guide = { v: number } | { h: number };

/** Axis-aligned box of a piece (rotation is always a multiple of 90°). */
export function itemBox(it: Item): Rect {
  const turned = it.a % 180 !== 0, w = turned ? it.d : it.w, h = turned ? it.w : it.d;
  return { x: it.x - w / 2, y: it.y - h / 2, w, h };
}

/** Smallest box around several, or null for none. */
export function bounds(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((b) => b.x)), y = Math.min(...rects.map((b) => b.y));
  return { x, y, w: Math.max(...rects.map((b) => b.x + b.w)) - x, h: Math.max(...rects.map((b) => b.y + b.h)) - y };
}

// Half a centimetre of tolerance so "flush against the wall" doesn't count as overlapping.
export const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;

/** A piece together with everything grouped with it. */
export const groupOf = (items: Item[], it: Item) => (it.g ? items.filter((i) => i.g === it.g) : [it]);

/** Walls and fixtures: what furniture can't stand in. */
export const solids = (plan: PlanData): Rect[] => [...plan.walls, ...plan.fixtures];

/** Every solid box except the given pieces. */
export const obstacles = (plan: PlanData, skip: Item[]): Rect[] =>
  [...solids(plan), ...plan.items.filter((o) => !skip.includes(o)).map(itemBox)];

/** How furniture is stacked: the height each piece stands at, and which pairs of things are stacked rather than colliding. */
export type Stacking = { z: Map<string, number>; pairs: Set<string> };
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
/** How much of a piece's footprint has to lie on something for it to count as standing on it, not bumping into it. */
const STACK_SHARE = 0.5;
/**
 * Whether something overlapping an open table is under it or on it can only be guessed from its height:
 * what stands on the floor under a desk (drawer unit, pedestal) nearly reaches the top, what stands on a
 * desk (lamp, screen) is lower than that. From this share of the table's height up to the table's height, it is under.
 */
const UNDER_SHARE = 0.7;

/**
 * Pieces that overlap a lot are taken to be stacked: a lamp on a table, a microwave on the kitchen
 * bench, a table on a rug. The piece with the smaller footprint goes on top; of two equal ones, the
 * later in the list. Something almost as high as an open table (a drawer unit) stands under it
 * instead. Fixed fittings can be stood on; walls can't.
 */
export function stacking(plan: PlanData): Stacking {
  const z = new Map<string, number>(), pairs = new Set<string>();
  const area = (r: Rect) => r.w * r.h;
  const shared = (a: Rect, b: Rect) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  // `under` is the height of the free space beneath an open piece.
  const placed: { id: string; box: Rect; floor: number; top: number; under: number }[] =
    plan.fixtures.map((f) => ({ id: `fixture:${f.id}`, box: f, floor: 0, top: f.height, under: 0 }));
  const bySize = plan.items.map((it) => ({ it, box: itemBox(it) })).sort((a, b) => area(b.box) - area(a.box));
  for (const { it, box } of bySize) {
    let floor = 0;
    for (const p of placed) {
      if (shared(box, p.box) < STACK_SHARE * area(box)) continue;
      pairs.add(pairKey(it.id, p.id));
      floor = Math.max(floor, it.h < p.under && it.h >= UNDER_SHARE * p.under ? p.floor : p.top);
    }
    z.set(it.id, floor);
    placed.push({ id: it.id, box, floor, top: floor + it.h, under: it.open ? it.h : 0 });
  }
  return { z, pairs };
}

// Pieces in one group may overlap on purpose (a drawer unit under a desk), so they don't flag each other.
// Neither do pieces that are stacked.
export function isHit(plan: PlanData, it: Item, stack: Stacking = stacking(plan)): boolean {
  const b = itemBox(it), mates = groupOf(plan.items, it);
  return plan.walls.some((w) => overlap(b, w))
    || plan.fixtures.some((f) => overlap(b, f) && !stack.pairs.has(pairKey(it.id, `fixture:${f.id}`)))
    || plan.items.some((o) => !mates.includes(o) && overlap(b, itemBox(o)) && !stack.pairs.has(pairKey(it.id, o.id)));
}

export const imageRect = (plan: PlanData): Rect | null =>
  plan.image && { x: plan.image.x, y: plan.image.y, w: plan.image.w * plan.image.cmPerPx, h: plan.image.h * plan.image.cmPerPx };

const dimRect = (d: Dim): Rect => ({ x: Math.min(d.x1, d.x2), y: Math.min(d.y1, d.y2), w: Math.abs(d.x2 - d.x1), h: Math.abs(d.y2 - d.y1) });

/** The flat itself: its walls and fixtures, or the image while nothing is drawn yet. */
export function flatBox(plan: PlanData): Rect {
  return bounds(solids(plan)) ?? imageRect(plan) ?? { x: 0, y: 0, w: 600, h: 450 };
}

/** Everything that belongs to the drawing: flat, image, measurements and labels. Used for fitting and export. */
export function drawingBox(plan: PlanData, withImage: boolean): Rect {
  const image = withImage ? imageRect(plan) : null;
  const all = [
    flatBox(plan), ...(image ? [image] : []),
    ...plan.dims.map(dimRect).map((r) => ({ x: r.x - 22, y: r.y - 22, w: r.w + 44, h: r.h + 44 })),
    ...plan.labels.map((l) => ({ x: l.x - 60, y: l.y - 16, w: 120, h: 24 })),
  ];
  return bounds(all) ?? flatBox(plan);
}

/**
 * The "not placed yet" box beside the drawing, where new furniture lands. It sits next to the
 * flat rather than next to the image, which is often much wider than the flat drawn from it.
 */
export function parkBox(plan: PlanData): Rect {
  const b = drawingBox(plan, false);
  return { x: b.x + b.w + 50, y: b.y, w: 330, h: Math.max(600, b.h) };
}

export const inFlat = (plan: PlanData, it: Item) => overlap(itemBox(it), flatBox(plan));

/** Line the pieces up in rows inside the parking box. Changes the pieces in place. */
export function parkItems(plan: PlanData, items: Item[]): void {
  const park = parkBox(plan), gap = 14, left = park.x + gap;
  let x = left, y = park.y + gap, rowH = 0;
  for (const it of items) {
    if (x > left && x + it.w > park.x + park.w - gap) { x = left; y += rowH + gap; rowH = 0; }
    it.x = x + it.w / 2; it.y = y + it.d / 2; it.a = 0;
    x += it.w + gap; rowH = Math.max(rowH, it.d);
  }
}

export type Gap = { x1: number; y1: number; x2: number; y2: number; len: number };

/** Free distance from each side of a box to the nearest obstacle. */
export function gaps(b: Rect, obs: Rect[]): Gap[] {
  const spanY = (o: Rect) => o.y < b.y + b.h - 0.5 && o.y + o.h > b.y + 0.5;
  const spanX = (o: Rect) => o.x < b.x + b.w - 0.5 && o.x + o.w > b.x + 0.5;
  const cy = b.y + b.h / 2, cx = b.x + b.w / 2;
  const left = Math.max(...obs.filter((o) => spanY(o) && o.x + o.w <= b.x + 0.5).map((o) => o.x + o.w), -Infinity);
  const right = Math.min(...obs.filter((o) => spanY(o) && o.x >= b.x + b.w - 0.5).map((o) => o.x), Infinity);
  const up = Math.max(...obs.filter((o) => spanX(o) && o.y + o.h <= b.y + 0.5).map((o) => o.y + o.h), -Infinity);
  const down = Math.min(...obs.filter((o) => spanX(o) && o.y >= b.y + b.h - 0.5).map((o) => o.y), Infinity);
  const out: Omit<Gap, "len">[] = [];
  if (Number.isFinite(left)) out.push({ x1: left, y1: cy, x2: b.x, y2: cy });
  if (Number.isFinite(right)) out.push({ x1: b.x + b.w, y1: cy, x2: right, y2: cy });
  if (Number.isFinite(up)) out.push({ x1: cx, y1: up, x2: cx, y2: b.y });
  if (Number.isFinite(down)) out.push({ x1: cx, y1: b.y + b.h, x2: cx, y2: down });
  return out.map((g) => ({ ...g, len: Math.round(Math.abs(g.x2 - g.x1) + Math.abs(g.y2 - g.y1)) })).filter((g) => g.len >= 1);
}

/** How close, in cm, an edge has to be to snap at the given zoom (screen px per cm). */
export const snapTolerance = (scale: number) => clamp(9 / scale, 2, 12);

/** Top-left position for a moved box of size w × h, pulled onto nearby edges of the given boxes. */
export function snapBox(size: { w: number; h: number }, others: Rect[], x: number, y: number, tol: number): { x: number; y: number; guides: Guide[] } {
  x = Math.round(x); y = Math.round(y);
  let bx: { d: number; at: number } | null = null, by: { d: number; at: number } | null = null;
  for (const o of others) {
    const nearY = o.y < y + size.h + 60 && o.y + o.h > y - 60, nearX = o.x < x + size.w + 60 && o.x + o.w > x - 60;
    if (nearY) for (const edge of [o.x, o.x + o.w]) for (const mine of [x, x + size.w]) {
      const d = edge - mine;
      if (Math.abs(d) <= tol && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, at: edge };
    }
    if (nearX) for (const edge of [o.y, o.y + o.h]) for (const mine of [y, y + size.h]) {
      const d = edge - mine;
      if (Math.abs(d) <= tol && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, at: edge };
    }
  }
  const guides: Guide[] = [];
  if (bx) { x += bx.d; guides.push({ v: bx.at }); }
  if (by) { y += by.d; guides.push({ h: by.at }); }
  return { x, y, guides };
}

/** A point pulled onto nearby edges of the given boxes, each axis on its own. */
export function snapPoint(others: Rect[], x: number, y: number, tol: number): { x: number; y: number; guides: Guide[] } {
  return snapBox({ w: 0, h: 0 }, others, x, y, tol);
}

/** The box spanned by two corner points. */
export const rectFrom = (ax: number, ay: number, bx: number, by: number): Rect =>
  ({ x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) });

/**
 * A freshly drawn window laid into the wall it covers most: as thick as that wall
 * and no longer than it. Left as drawn when it touches no wall.
 */
export function fitWindowToWall(win: Rect, walls: Rect[]): Rect {
  let best: Rect | null = null, bestArea = 0;
  for (const wall of walls) {
    const w = Math.min(win.x + win.w, wall.x + wall.w) - Math.max(win.x, wall.x);
    const h = Math.min(win.y + win.h, wall.y + wall.h) - Math.max(win.y, wall.y);
    if (w > 0 && h > 0 && w * h > bestArea) { best = wall; bestArea = w * h; }
  }
  if (!best) return win;
  if (best.w >= best.h) {
    const x = Math.max(win.x, best.x);
    return { x, y: best.y, w: Math.min(win.x + win.w, best.x + best.w) - x, h: best.h };
  }
  const y = Math.max(win.y, best.y);
  return { x: best.x, y, w: best.w, h: Math.min(win.y + win.h, best.y + best.h) - y };
}

/**
 * Stretch the drawing around a fixed point, after the image's scale was corrected.
 * Furniture keeps its real size and only moves along.
 */
export function rescale(plan: PlanData, factor: number, ox: number, oy: number): PlanData {
  const px = (v: number) => Math.round((ox + (v - ox) * factor) * 10) / 10;
  const py = (v: number) => Math.round((oy + (v - oy) * factor) * 10) / 10;
  const len = (v: number) => Math.max(1, Math.round(v * factor * 10) / 10);
  const box = <T extends Rect>(r: T): T => ({ ...r, x: px(r.x), y: py(r.y), w: len(r.w), h: len(r.h) });
  return {
    ...plan,
    image: plan.image && { ...plan.image, cmPerPx: plan.image.cmPerPx * factor, x: px(plan.image.x), y: py(plan.image.y), calibrated: true },
    walls: plan.walls.map(box), windows: plan.windows.map(box), fixtures: plan.fixtures.map(box),
    dims: plan.dims.map((d) => ({ ...d, x1: px(d.x1), y1: py(d.y1), x2: px(d.x2), y2: py(d.y2) })),
    labels: plan.labels.map((l) => ({ ...l, x: px(l.x), y: py(l.y) })),
    items: plan.items.map((i) => ({ ...i, x: px(i.x), y: py(i.y) })),
  };
}

export const dimLength = (d: { x1: number; y1: number; x2: number; y2: number }) => Math.round(Math.hypot(d.x2 - d.x1, d.y2 - d.y1));

/** The area covered by a set of boxes, in cm². Where boxes overlap, the overlap counts once. */
export function unionArea(rects: Rect[]): number {
  const xs = [...new Set(rects.flatMap((r) => [r.x, r.x + r.w]))].sort((a, b) => a - b);
  const ys = [...new Set(rects.flatMap((r) => [r.y, r.y + r.h]))].sort((a, b) => a - b);
  let area = 0;
  // Cut the plane along every box edge; each resulting cell is either wholly inside some box or wholly outside all.
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < ys.length; j++) {
    const x0 = xs[i] as number, x1 = xs[i + 1] as number, y0 = ys[j] as number, y1 = ys[j + 1] as number;
    if (rects.some((r) => r.x <= x0 && r.x + r.w >= x1 && r.y <= y0 && r.y + r.h >= y1)) area += (x1 - x0) * (y1 - y0);
  }
  return area;
}
