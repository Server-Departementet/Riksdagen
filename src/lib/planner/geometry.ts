import type { Angle, Dim, Item, PlanData, PlanImage, Rect } from "@/lib/planner/plan";
import { clamp, cleanStretch } from "@/lib/planner/plan";
import { DOOR_HEIGHT, doorBox, inDoorWay } from "@/lib/planner/doors";

/** A vertical (`v`, an x position) or horizontal (`h`, a y position) snapping guide. */
export type Guide = { v: number } | { h: number };

/** Axis-aligned box of a piece (rotation is always a multiple of 90°). */
export function itemBox(it: Item): Rect {
  const turned = it.a % 180 !== 0, w = turned ? it.d : it.w, h = turned ? it.w : it.d;
  return { x: it.x - w / 2, y: it.y - h / 2, w, h };
}

/**
 * A strip `depth` thick along the back edge of a piece's box, `inset` in from each end. The back is the
 * edge at the top of the plan before the piece is turned, and turns clockwise with it. Chairs have their backrest there.
 */
export function backStrip(b: Rect, a: Angle, depth: number, inset = 0): Rect {
  switch (a) {
    case 0: return { x: b.x + inset, y: b.y, w: b.w - 2 * inset, h: depth };
    case 90: return { x: b.x + b.w - depth, y: b.y + inset, w: depth, h: b.h - 2 * inset };
    case 180: return { x: b.x + inset, y: b.y + b.h - depth, w: b.w - 2 * inset, h: depth };
    case 270: return { x: b.x, y: b.y + inset, w: depth, h: b.h - 2 * inset };
  }
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

/**
 * How furniture is stacked: the height each piece stands at, and which pairs of things don't collide
 * although their footprints overlap, because one stands on or under the other or hangs clear of it.
 */
export type Stacking = { z: Map<string, number>; pairs: Set<string> };
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
/** How much of a piece's footprint has to lie on something for it to count as standing on it, not bumping into it. */
const STACK_SHARE = 0.5;
/** Pieces up to this high (cm) are taken to be rugs and mats, which furniture stands on rather than bumps into. */
const RUG_HEIGHT = 3;
/**
 * Whether something overlapping an open table is under it or on it can only be guessed from its height:
 * what stands on the floor under a desk (drawer unit, pedestal) nearly reaches the top, what stands on a
 * desk (lamp, screen) is lower than that. From this share of the table's height up to the table's height, it is under.
 */
const UNDER_SHARE = 0.7;

/**
 * Pieces that overlap a lot are taken to be stacked: a lamp on a table, a microwave on the kitchen
 * bench, a table on a rug. The piece with the smaller footprint goes on top; of two equal ones, the
 * later in the list. Something almost as high as a table (a drawer unit) stands under it instead,
 * and so does a chair. Fixed fittings can be stood on; walls can't.
 *
 * A piece's own settings overrule the guess. `stack`: "floor" keeps it on the floor, and it then collides
 * with what it would have stood on; "top" puts it on what it overlaps a lot, never under; "under" puts it
 * beneath any table it overlaps at all. A piece set to "top" or "under" can go on or under a smaller piece too.
 * `lift` fixes the piece at that height whatever it overlaps. Other pieces still stand on it, and the
 * room beneath it counts like the room under a table. It doesn't collide with things wholly below or above it.
 */
export function stacking(plan: PlanData): Stacking {
  const z = new Map<string, number>(), pairs = new Set<string>();
  const area = (r: Rect) => r.w * r.h;
  const shared = (a: Rect, b: Rect) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  // `rests` is what the thing stands on, or under. Fixtures have no `it` and always stand on the floor.
  // `lift` is set for what is fixed above the floor: a piece with a height of its own, a wall-hung fitting.
  type Thing = { id: string; box: Rect; h: number; it?: Item; lift?: number; rests: { on: Thing; under: boolean }[] };
  const fixtures: Thing[] = plan.fixtures.map((f) => ({ id: `fixture:${f.id}`, box: f, h: f.height, ...(f.lift ? { lift: f.lift } : {}), rests: [] }));
  const pieces: Thing[] = plan.items.map((it) => ({ id: it.id, box: itemBox(it), h: it.h, it, ...(it.lift !== undefined ? { lift: it.lift } : {}), rests: [] }))
    .sort((a, b) => area(b.box) - area(a.box));
  /** The height of the free space beneath a thing: below a table's top, and below anything fixed above the floor. */
  const room = (p: Thing) => (p.lift ?? 0) + (p.it?.model === "table" ? p.h : 0);
  /** A floor covering: a piece this low, lying on the floor. */
  const rug = (t: Thing) => !!t.it && t.it.lift === undefined && t.h <= RUG_HEIGHT;
  const told = (t: Thing) => t.it?.stack === "top" || t.it?.stack === "under";

  /** Make `t` stand on or under `p` if t's footprint and settings say so. */
  const rest = (t: Thing, p: Thing): boolean => {
    const it = t.it;
    if (!it || it.stack === "floor" || it.lift !== undefined) return false;
    const on = shared(t.box, p.box), free = room(p), chair = it.model === "chair" || it.model === "office-chair";
    // A chair at a table is pushed in under it, however little and however high its back is. So is a piece told to stand under.
    const pushedIn = free > 0 && on > 0.25 && (it.stack === "under" || (chair && it.stack !== "top"));
    if (!pushedIn && on < STACK_SHARE * area(t.box)) return false;
    pairs.add(pairKey(t.id, p.id));
    // Under a table only what nearly reaches its top counts as standing under it (a lamp is on the table).
    // Under something fixed above the floor, whatever fits is under it: nobody stands a stool on a wall cabinet.
    const fits = p.lift !== undefined ? it.h <= p.lift : it.h < free && it.h >= UNDER_SHARE * free;
    t.rests.push({ on: p, under: it.stack !== "top" && (pushedIn || fits) });
    return true;
  };
  pieces.forEach((t, i) => {
    for (const p of fixtures) rest(t, p);
    for (const p of pieces.slice(0, i)) {
      // A rug is never in the way: whatever touches it stands on it, whichever of the two is bigger
      // and however little of the piece is on it. Two rugs fall through to the ordinary rule.
      if (rug(t) !== rug(p)) {
        const [mat, other] = rug(t) ? [t, p] : [p, t];
        if (shared(mat.box, other.box) <= 0.25) continue;
        pairs.add(pairKey(mat.id, other.id));
        if (other.it?.stack !== "floor" && other.it?.lift === undefined) other.rests.push({ on: mat, under: false });
        continue;
      }
      // Of two pieces the smaller is the one that goes on or under the other, unless only the bigger was told where to stand.
      const [first, second] = told(p) && !told(t) ? [p, t] : [t, p];
      if (!rest(first, second) && told(p)) rest(second, first);
    }
  });

  const busy = new Set<string>();
  const level = (t: Thing): number => {
    const known = z.get(t.id);
    if (!t.it || known !== undefined) return known ?? t.lift ?? 0;
    let floor = t.it.lift ?? 0;
    busy.add(t.id);
    for (const { on, under } of t.rests) {
      // Settings can make pieces rest on each other in a circle. The link that would close the circle is left out.
      if (busy.has(on.id)) continue;
      // Under a table is where the table stands; under a piece fixed above the floor is the floor.
      floor = Math.max(floor, under ? (on.lift === undefined ? level(on) : 0) : level(on) + on.h);
    }
    busy.delete(t.id);
    z.set(t.id, floor);
    return floor;
  };
  for (const t of pieces) level(t);

  // Whatever is fixed above the floor only collides with what shares its height.
  for (const t of [...fixtures, ...pieces]) {
    if (t.lift === undefined) continue;
    for (const o of [...fixtures, ...pieces]) {
      if (o === t || shared(t.box, o.box) <= 0) continue;
      if (level(t) >= level(o) + o.h || level(o) >= level(t) + t.h) pairs.add(pairKey(t.id, o.id));
    }
  }
  return { z, pairs };
}

// Pieces in one group may overlap on purpose (a drawer unit under a desk), so they don't flag each other.
// Neither do pieces that are stacked, or one above the other without touching.
export function isHit(plan: PlanData, it: Item, stack: Stacking = stacking(plan)): boolean {
  const b = itemBox(it), mates = groupOf(plan.items, it);
  return plan.walls.some((w) => overlap(b, w))
    || plan.fixtures.some((f) => overlap(b, f) && !stack.pairs.has(pairKey(it.id, `fixture:${f.id}`)))
    || plan.items.some((o) => !mates.includes(o) && overlap(b, itemBox(o)) && !stack.pairs.has(pairKey(it.id, o.id)));
}

/**
 * Whether a piece keeps a door from opening or stands in a doorway. A warning of its own, apart from isHit: the
 * piece collides with nothing, it is only in the way. Rugs never are, and neither is what hangs or stands
 * above the door leaf. Fixed fittings are not checked: the door was built to clear them.
 */
export function blocksDoor(plan: PlanData, it: Item, stack: Stacking = stacking(plan), doors = plan.doors ?? []): boolean {
  if (!doors.length || (it.lift === undefined && it.h <= RUG_HEIGHT) || (stack.z.get(it.id) ?? 0) >= DOOR_HEIGHT) return false;
  const b = itemBox(it);
  return doors.some((d) => inDoorWay(d, b));
}

/** The doors that some piece of furniture is in the way of. */
export const blockedDoors = (plan: PlanData, stack: Stacking = stacking(plan)) =>
  (plan.doors ?? []).filter((d) => plan.items.some((it) => blocksDoor(plan, it, stack, [d])));

export const imageRect = (plan: PlanData): Rect | null =>
  plan.image && { x: plan.image.x, y: plan.image.y, w: plan.image.w * plan.image.cmPerPx, h: plan.image.h * plan.image.cmPerPx * (plan.image.stretch ?? 1) };

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
    // A door opening outwards swings beyond the walls.
    ...(plan.doors ?? []).map(doorBox),
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
export const rescale = (plan: PlanData, factor: number, ox: number, oy: number): PlanData => rescaleXY(plan, factor, factor, ox, oy);

/**
 * The same with a factor of its own for each direction, for a drawing that is right one way and off the other,
 * or squeezed. The image is stretched along: its horizontal scale follows `fx`, and `stretch` takes up the difference.
 */
export function rescaleXY(plan: PlanData, fx: number, fy: number, ox: number, oy: number): PlanData {
  const round = (v: number) => Math.round(v * 10) / 10;
  const px = (v: number) => round(ox + (v - ox) * fx), py = (v: number) => round(oy + (v - oy) * fy);
  const lenX = (v: number) => Math.max(1, round(v * fx)), lenY = (v: number) => Math.max(1, round(v * fy));
  // Every kind of thing in a plan is one of these three shapes. A new kind is one more line in the list below.
  const box = <T extends Rect>(r: T): T => ({ ...r, x: px(r.x), y: py(r.y), w: lenX(r.w), h: lenY(r.h) });
  const point = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: px(p.x), y: py(p.y) });
  const line = <T extends { x1: number; y1: number; x2: number; y2: number }>(l: T): T => ({ ...l, x1: px(l.x1), y1: py(l.y1), x2: px(l.x2), y2: py(l.y2) });
  const image = (i: PlanImage): PlanImage => {
    // Equal factors leave the stretch exactly as it was, so a uniform correction never picks up rounding noise.
    const { stretch: old, ...rest } = i, stretch = fx === fy ? old : cleanStretch(((old ?? 1) * fy) / fx);
    return { ...rest, cmPerPx: i.cmPerPx * fx, x: px(i.x), y: py(i.y), calibrated: true, ...(stretch === undefined ? {} : { stretch }) };
  };
  return {
    ...plan,
    image: plan.image && image(plan.image),
    walls: plan.walls.map(box),
    windows: plan.windows.map(box),
    fixtures: plan.fixtures.map(box),
    dims: plan.dims.map(line),
    labels: plan.labels.map(point),
    ...(plan.doors ? { doors: plan.doors.map(box) } : {}),
    // Furniture is the size it is: only its place follows.
    items: plan.items.map(point),
    // The furniture of the variants not being shown stands in the same flat, so it moves the same way.
    ...(plan.variants ? { variants: plan.variants.map((v) => ({ ...v, items: v.items.map(point) })) } : {}),
  };
}

/** How far off a drawing can be and still be corrected from one measurement: beyond this the number typed is a slip. */
export const MIN_CORRECTION = 0.2;
export const MAX_CORRECTION = 5;

/**
 * The factors that make a measurement line `realCm` long. "all" scales both directions alike. "axis" scales only
 * the direction the line runs in (see `dimAxis`) and leaves the other alone; a slanted line then gets the factor
 * that brings its whole length to `realCm`. Null when no sensible factor does it.
 */
export function dimCorrection(d: Line4, realCm: number, mode: "all" | "axis"): { fx: number; fy: number } | null {
  const dx = Math.abs(d.x2 - d.x1), dy = Math.abs(d.y2 - d.y1), drawn = Math.hypot(dx, dy);
  if (!Number.isFinite(realCm) || realCm <= 0 || drawn < 1) return null;
  const ok = (f: number) => Number.isFinite(f) && f >= MIN_CORRECTION && f <= MAX_CORRECTION;
  if (mode === "all") { const f = realCm / drawn; return ok(f) ? { fx: f, fy: f } : null; }
  const along = dimAxis(d) === "x" ? dx : dy, across = dimAxis(d) === "x" ? dy : dx;
  // The part of the line across its axis stays as long as it is; the rest of the new length has to come from along it.
  const f = Math.sqrt(realCm * realCm - across * across) / along;
  if (!ok(f)) return null;
  return dimAxis(d) === "x" ? { fx: f, fy: 1 } : { fx: 1, fy: f };
}

type Line4 = { x1: number; y1: number; x2: number; y2: number };
/** The direction a measurement line mostly runs in: "x" across the plan, "y" up and down it. */
export const dimAxis = (d: Line4): "x" | "y" => (Math.abs(d.x2 - d.x1) >= Math.abs(d.y2 - d.y1) ? "x" : "y");

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

/** The widest gap in a wall that still counts as a doorway rather than as the outline being open, in cm. */
const DOORWAY = 150;

/**
 * The floor inside the outer walls, in cm²: everything that can't be reached from outside the drawing without
 * crossing a wall, a window, a door or a doorway. Inner walls are not counted, so it comes out a few percent under the
 * stated floor area. Null when the walls don't enclose most of the flat (nothing drawn yet, or an outline left
 * open), where any figure would mislead.
 */
export function enclosedArea(plan: PlanData): number | null {
  const shell: Rect[] = [...plan.walls, ...plan.windows, ...(plan.doors ?? [])], box = bounds(plan.walls);
  if (!box) return null;
  // Cut the plane along every edge, with a ring of open cells around it all for "outside" to start from.
  const cuts = (vals: number[]) => { const s = [...new Set(vals)].sort((a, b) => a - b); return [(s[0] ?? 0) - 1, ...s, (s[s.length - 1] ?? 0) + 1]; };
  const xs = cuts(shell.flatMap((r) => [r.x, r.x + r.w])), ys = cuts(shell.flatMap((r) => [r.y, r.y + r.h]));
  const nx = xs.length - 1, ny = ys.length - 1, at = (i: number, j: number) => j * nx + i;
  const xi = new Map(xs.map((v, i) => [v, i])), yi = new Map(ys.map((v, i) => [v, i]));
  // Per cell: 0 open, 1 wall, 2 open but too narrow to pass (a doorway), 3 reached from outside.
  const cell = new Uint8Array(nx * ny);
  for (const r of shell) {
    const i1 = xi.get(r.x + r.w) ?? 0, j1 = yi.get(r.y + r.h) ?? 0;
    for (let j = yi.get(r.y) ?? 0; j < j1; j++) cell.fill(1, at(xi.get(r.x) ?? 0, j), at(i1, j));
  }
  // An open stretch between two walls no wider than a doorway is shut, along rows and then along columns.
  const shut = (n: number, lines: number, edges: number[], index: (k: number, line: number) => number) => {
    for (let line = 0; line < lines; line++) for (let k = 0, from = -1; k < n; k++) {
      if (cell[index(k, line)] !== 1) continue;
      if (from >= 0 && k > from + 1 && (edges[k] as number) - (edges[from + 1] as number) <= DOORWAY) {
        for (let g = from + 1; g < k; g++) cell[index(g, line)] = 2;
      }
      from = k;
    }
  };
  shut(nx, ny, xs, (i, j) => at(i, j));
  shut(ny, nx, ys, (j, i) => at(i, j));
  const todo = [0];
  cell[0] = 3;
  for (let c = todo.pop(); c !== undefined; c = todo.pop()) {
    const i = c % nx, j = (c - i) / nx;
    for (const [a, b] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]] as const) {
      if (a < 0 || b < 0 || a >= nx || b >= ny || cell[at(a, b)] !== 0) continue;
      cell[at(a, b)] = 3;
      todo.push(at(a, b));
    }
  }
  let area = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (cell[at(i, j)] === 0 || cell[at(i, j)] === 2) area += ((xs[i + 1] as number) - (xs[i] as number)) * ((ys[j + 1] as number) - (ys[j] as number));
  }
  // An outline with a wide opening lets the outside in and leaves only scraps; even an L-shaped flat fills well over this share of its box.
  return area >= 0.4 * box.w * box.h ? area : null;
}

/** Free floor narrower than this between two things is too tight to walk through comfortably, in cm. */
export const NARROW_PASSAGE = 70;
/** Up to this width a passage works but is felt as cramped; flagged more quietly. */
export const COMFORT_PASSAGE = 90;
/** Things closer together than this stand together on purpose (a bedside table by the bed), not with a passage between them. */
const PASSAGE_MIN = 10;
/** The two facing sides have to run alongside each other at least this far for the space between them to be somewhere one walks. */
const PASSAGE_LENGTH = 30;
/** What is fixed at least this high above the floor is walked under. */
const HEADROOM = 200;

const AXES = [0, 1] as const;

/**
 * A strip of free floor between two facing things. The box is the strip itself; `across` is the direction
 * it is too narrow in (and so the direction it is crossed by its width, `width` cm, rounded).
 * `tight` when under NARROW_PASSAGE, otherwise only under COMFORT_PASSAGE.
 */
export type Passage = Rect & { width: number; across: "x" | "y"; tight: boolean };

/**
 * Where furniture leaves too little floor to walk: every strip between a piece and a wall, a fitting or
 * another piece that is PASSAGE_MIN up to under COMFORT_PASSAGE wide and at least PASSAGE_LENGTH long.
 *
 * What stands in the way is walls, fittings and the pieces inside the flat. Not rugs, not what is fixed
 * above HEADROOM, and not a piece standing on another (the lower one covers it). Two walls or fittings
 * close together are the building and not flagged; nor are two pieces of one group, which were put
 * together on purpose. Where a third thing stands in the strip, the strip is cut short around it: the
 * narrower gaps on either side of that thing are found as pairs of their own.
 *
 * Every pair of things is compared, and each pair that faces closely is checked against every thing:
 * O(n²) for n things plus O(n) per close pair, so around 10⁴ cheap steps for 50 pieces and 100 walls,
 * and O(k²) for the k strips found.
 */
export function narrowPassages(plan: PlanData, stack: Stacking = stacking(plan)): Passage[] {
  // Boxes as [x, y] corners, so that one piece of code does both directions.
  type Thing = { lo: [number, number]; hi: [number, number]; piece: boolean; g?: string };
  const thing = (r: Rect, piece: boolean, g?: string): Thing => ({ lo: [r.x, r.y], hi: [r.x + r.w, r.y + r.h], piece, ...(g ? { g } : {}) });
  const flat = flatBox(plan); // once, not per piece as `inFlat` would
  const things: Thing[] = [
    ...plan.walls.map((w) => thing(w, false)),
    ...plan.fixtures.filter((f) => (f.lift ?? 0) < HEADROOM).map((f) => thing(f, false)),
    ...plan.items.filter((it) => overlap(itemBox(it), flat) && (it.lift === undefined
      // Standing on a rug is standing on the floor; standing on anything higher is standing on furniture.
      ? it.h > RUG_HEIGHT && (stack.z.get(it.id) ?? 0) <= RUG_HEIGHT
      : it.lift < HEADROOM)).map((it) => thing(itemBox(it), true, it.g)),
  ];

  // Strips with the same start and width lie in one line (along a wall drawn in several stretches, past
  // two pieces standing side by side) and are joined before their length is judged.
  const lines = new Map<string, { k: 0 | 1; at: number; gap: number; spans: [number, number][] }>();
  for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) {
    const a = things[i] as Thing, b = things[j] as Thing;
    if ((!a.piece && !b.piece) || (a.g && a.g === b.g)) continue;
    for (const k of AXES) {
      const o = k === 0 ? 1 : 0;
      // The far pairs are nearly all of them, so they are dropped before anything is built.
      const ahead = a.hi[k] <= b.lo[k], p = ahead ? a : b, q = ahead ? b : a;
      const gap = q.lo[k] - p.hi[k];
      if (gap < PASSAGE_MIN || gap >= COMFORT_PASSAGE) continue;
      let spans: [number, number][] = [[Math.max(a.lo[o], b.lo[o]), Math.min(a.hi[o], b.hi[o])]];
      if ((spans[0] as [number, number])[1] - (spans[0] as [number, number])[0] < 1) continue;
      for (const c of things) {
        // Half a centimetre of tolerance, as in `overlap`: what stands flush against either side isn't in the gap.
        if (c === a || c === b || c.hi[k] <= p.hi[k] + 0.5 || c.lo[k] >= q.lo[k] - 0.5) continue;
        spans = spans.flatMap(([s, e]): [number, number][] =>
          (c.hi[o] <= s || c.lo[o] >= e ? [[s, e]] : [[s, Math.min(e, c.lo[o])], [Math.max(s, c.hi[o]), e]]));
      }
      // Rounded for the key only: positions are multiples of 0.05 that don't all come out exact in binary.
      const key = `${k}|${Math.round(p.hi[k] * 100)}|${Math.round(gap * 100)}`;
      const line = lines.get(key) ?? { k, at: p.hi[k], gap, spans: [] };
      line.spans.push(...spans.filter(([s, e]) => e > s));
      lines.set(key, line);
    }
  }

  const out: Passage[] = [];
  for (const { k, at, gap, spans } of lines.values()) {
    spans.sort((s, t) => s[0] - t[0]);
    const joined: [number, number][] = [];
    for (const [s, e] of spans) {
      const last = joined[joined.length - 1];
      if (last && s <= last[1] + 0.5) last[1] = Math.max(last[1], e);
      else joined.push([s, e]);
    }
    for (const [s, e] of joined) {
      if (e - s < PASSAGE_LENGTH) continue;
      const box = k === 0 ? { x: at, y: s, w: gap, h: e - s } : { x: s, y: at, w: e - s, h: gap };
      out.push({ ...box, width: Math.round(gap), across: k === 0 ? "x" : "y", tight: gap < NARROW_PASSAGE });
    }
  }
  // A strip lying wholly within a narrower one (the 80 cm from a stool to the wall, inside the 50 cm between
  // bed and wall the stool stands in) says nothing new and would only put two figures on one bit of floor.
  const within = (b: Rect, c: Rect) => b.x >= c.x - 0.5 && b.y >= c.y - 0.5 && b.x + b.w <= c.x + c.w + 0.5 && b.y + b.h <= c.y + c.h + 0.5;
  return out.filter((b, i) => !out.some((c, j) => j !== i && within(b, c) && (c.width < b.width || (c.width === b.width && j < i))));
}
