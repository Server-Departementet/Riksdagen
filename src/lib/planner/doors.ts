import type { Door, Rect } from "@/lib/planner/plan";

/*
 * The geometry of doors: where the leaf sweeps, what stands in its way, and how a door drawn with the
 * door tool is laid into its wall. Kept free of the rest of the planner's geometry, which builds on it.
 */

/** How high a door leaf reaches, in cm: what is fixed above this, the leaf passes under. Also the height of the opening in the 3D view. */
export const DOOR_HEIGHT = 200;

/** A door's wall runs along the longer side of its opening. */
export const doorAlong = (d: Rect) => d.w >= d.h;

export type DoorSwing = {
  /** The hinge: the corner of the opening the leaf turns around, on the face of the wall it opens from */
  hx: number; hy: number;
  /** The leaf's free edge when it stands open at 90° */
  tx: number; ty: number;
  /** The leaf's free edge when it is shut: the other end of the opening, on the same wall face */
  jx: number; jy: number;
  /** The leaf's length, which is the opening's width */
  r: number;
  /** The square the quarter disc lies in */
  zone: Rect;
};

/** The quarter disc a door's leaf sweeps over, or null for a door that doesn't swing. */
export function doorSwing(d: Door): DoorSwing | null {
  if (d.swing === "none") return null;
  const along = doorAlong(d), r = along ? d.w : d.h;
  const out = d.swing === "neg" ? -1 : 1, across = d.hinge === "start" ? 1 : -1;
  // Along the wall, then across it: the hinge sits at one end of the opening, on the wall face the leaf opens from.
  const a = (along ? d.x : d.y) + (d.hinge === "start" ? 0 : r);
  const face = d.swing === "neg" ? (along ? d.y : d.x) : (along ? d.y + d.h : d.x + d.w);
  const at = (da: number, df: number) => (along ? { x: a + da, y: face + df } : { x: face + df, y: a + da });
  const h = at(0, 0), t = at(0, out * r), j = at(across * r, 0);
  return {
    hx: h.x, hy: h.y, tx: t.x, ty: t.y, jx: j.x, jy: j.y, r,
    zone: { x: Math.min(t.x, j.x), y: Math.min(t.y, j.y), w: r, h: r },
  };
}

/** The door as an SVG path: the leaf standing open at 90° and the arc its free edge follows. Empty for a door that doesn't swing. */
export function doorPath(d: Door): string {
  const s = doorSwing(d);
  if (!s) return "";
  // SVG's sweep flag: 1 when the arc turns clockwise on screen (y grows downwards) from the open leaf to the shut one.
  const clockwise = (s.tx - s.hx) * (s.jy - s.hy) - (s.ty - s.hy) * (s.jx - s.hx) > 0;
  return `M${s.hx} ${s.hy}L${s.tx} ${s.ty}A${s.r} ${s.r} 0 0 ${clockwise ? 1 : 0} ${s.jx} ${s.jy}`;
}

/** Everything a door takes up on the plan: the opening and, if it swings, the square around the swing. For framing the drawing. */
export function doorBox(d: Door): Rect {
  const s = doorSwing(d);
  if (!s) return d;
  const x = Math.min(d.x, s.zone.x), y = Math.min(d.y, s.zone.y);
  return { x, y, w: Math.max(d.x + d.w, s.zone.x + s.zone.w) - x, h: Math.max(d.y + d.h, s.zone.y + s.zone.h) - y };
}

// The same half centimetre of tolerance as for overlaps: standing flush against the door frame, or just touching the arc, is not blocking.
const TOLERANCE = 0.5;

/**
 * Whether a box on the floor is in the door's way: in the opening itself, or anywhere the leaf sweeps.
 * The sweep is the exact quarter disc, not its bounding square, so a piece tucked into the corner beyond the arc is fine.
 */
export function inDoorWay(d: Door, b: Rect): boolean {
  if (b.x < d.x + d.w - TOLERANCE && b.x + b.w > d.x + TOLERANCE && b.y < d.y + d.h - TOLERANCE && b.y + b.h > d.y + TOLERANCE) return true;
  const s = doorSwing(d);
  if (!s) return false;
  // The part of the box inside the swing's square is itself a box; it reaches into the quarter disc exactly when its point nearest the hinge does.
  const x0 = Math.max(b.x, s.zone.x), x1 = Math.min(b.x + b.w, s.zone.x + s.zone.w);
  const y0 = Math.max(b.y, s.zone.y), y1 = Math.min(b.y + b.h, s.zone.y + s.zone.h);
  if (x1 - x0 <= TOLERANCE || y1 - y0 <= TOLERANCE) return false;
  const nx = Math.min(Math.max(s.hx, x0), x1), ny = Math.min(Math.max(s.hy, y0), y1);
  return Math.hypot(nx - s.hx, ny - s.hy) < s.r - TOLERANCE;
}

/**
 * A door just drawn with the door tool, laid into the wall line it was dragged across. Like a window it takes
 * the wall's thickness. Dragged across a gap between wall pieces it fills the gap, jamb to jamb; dragged over
 * solid wall it stays where it was drawn, within that wall. Left as drawn when it touches no wall.
 */
export function fitDoorToWall(r: Rect, walls: Rect[]): Rect {
  // A little slack, so a drag that stops exactly at the jambs (the pointer snaps to wall edges) still finds its wall.
  const slack = 2, near: Rect = { x: r.x - slack, y: r.y - slack, w: r.w + 2 * slack, h: r.h + 2 * slack };
  const shared = (a: Rect, b: Rect) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const touching = walls.filter((w) => shared(w, near) > 0);
  if (!touching.length) return r;
  // The wall the door belongs to runs the way the door was dragged, if any such wall is touched: at a doorway
  // next to a corner, the wall across the end is a jamb, not the door's wall.
  const dragged = doorAlong(r), same = touching.filter((w) => doorAlong(w) === dragged);
  const best = (same.length ? same : touching).reduce((a, b) => (shared(b, near) > shared(a, near) ? b : a));
  const along = doorAlong(best);
  const lo = along ? r.x : r.y, hi = lo + (along ? r.w : r.h);
  const band: Rect = along ? { x: lo, y: best.y, w: hi - lo, h: best.h } : { x: best.x, y: lo, w: best.w, h: hi - lo };
  // What the walls leave free of the dragged stretch, in the wall line.
  let free: [number, number][] = [[lo, hi]];
  for (const w of walls) {
    if (shared(w, band) <= 0) continue;
    const from = along ? w.x : w.y, to = from + (along ? w.w : w.h);
    free = free.flatMap(([a, b]): [number, number][] => (to <= a || from >= b ? [[a, b]] : [[a, from], [to, b]])).filter(([a, b]) => b - a > 0.05);
  }
  const gap = free.reduce<[number, number] | null>((a, b) => (!a || b[1] - b[0] > a[1] - a[0] ? b : a), null);
  // Mostly free: it was dragged across a doorway, with a little wall caught at each end. Otherwise it lies on the wall.
  const [from, to] = gap && gap[1] - gap[0] >= (hi - lo) / 2
    ? gap
    : [Math.max(lo, along ? best.x : best.y), Math.min(hi, along ? best.x + best.w : best.y + best.h)];
  const len = Math.max(1, to - from);
  return along ? { x: from, y: best.y, w: len, h: best.h } : { x: best.x, y: from, w: best.w, h: len };
}

/**
 * The door a drag with the door tool makes: fitted to the wall, hinged at the end the drag started from and
 * opening to the side of the wall the drag ended on. Both can be changed afterwards.
 */
export function drawnDoor(from: { x: number; y: number }, to: { x: number; y: number }, walls: Rect[]): Omit<Door, "id"> {
  const box = fitDoorToWall({ x: Math.min(from.x, to.x), y: Math.min(from.y, to.y), w: Math.abs(to.x - from.x), h: Math.abs(to.y - from.y) }, walls);
  const along = doorAlong(box);
  const forwards = along ? from.x <= to.x : from.y <= to.y;
  const before = along ? to.y < box.y + box.h / 2 : to.x < box.x + box.w / 2;
  return { ...box, hinge: forwards ? "start" : "end", swing: before ? "neg" : "pos" };
}
