/*
 * Which way the plan faces, and from that which way each window looks. All of it follows from one number,
 * PlanData.bearing: the compass bearing of "up" on the plan.
 */

import type { PlanData, PlanWindow, Rect } from "@/lib/planner/plan";
import { bounds } from "@/lib/planner/geometry";

/** The eight compass points as Swedes abbreviate them, clockwise from north. */
export const COMPASS = ["N", "NO", "O", "SO", "S", "SV", "V", "NV"] as const;
export type CompassPoint = (typeof COMPASS)[number];

/** What a window towards each point gets, roughly. Deliberately vague: it says nothing of season, floor or what stands outside. */
export const LIGHT: Record<CompassPoint, string> = {
  N: "ingen direkt sol", NO: "tidig morgonsol", O: "morgonsol", SO: "förmiddagssol",
  S: "sol mitt på dagen", SV: "eftermiddagssol", V: "kvällssol", NV: "sen kvällssol",
};

export const turn = (deg: number) => ((deg % 360) + 360) % 360;
/** The nearest of the eight compass points to a bearing. */
export const compassPoint = (deg: number): CompassPoint => COMPASS[Math.round(turn(deg) / 45) % 8] as CompassPoint;
/** Where north points on the plan, in degrees clockwise from up: what a north arrow is turned by. */
export const northAngle = (bearing: number) => turn(360 - bearing);

/** A side of the plan as drawn. */
export type Side = "up" | "right" | "down" | "left";
const SIDE_TURN: Record<Side, number> = { up: 0, right: 90, down: 180, left: 270 };
/** The compass bearing of a direction on the plan. */
export const sideBearing = (side: Side, bearing: number) => turn(bearing + SIDE_TURN[side]);

/**
 * Which side of a window is outdoors, or null when the drawing doesn't say.
 *
 * A window lies in a wall along x or along y, so it looks one of two opposite ways. Looking out from the middle
 * half of the window, the indoor side sooner or later meets another wall or window of the flat; the outdoor side
 * meets nothing. That holds for windows in the inner corner of an L-shaped flat too, where "away from the middle
 * of the flat" picks the wrong side. When both sides or neither meet something (a window onto a yard the flat
 * wraps around, a window between two rooms, a flat with half its walls drawn), it falls back on the side that
 * points away from the middle of the walls' bounding box, which is then only a guess.
 */
export function outsideOf(win: PlanWindow, plan: PlanData): Side | null {
  const along = win.w >= win.h; // the wall runs along x: the window looks up or down
  const others: Rect[] = [...plan.walls, ...plan.windows.filter((w) => w.id !== win.id)];
  // The middle half only, so a wall that meets this one right beside the window isn't taken for something in front of it.
  const lo = along ? win.x + win.w / 4 : win.y + win.h / 4, hi = along ? win.x + (3 * win.w) / 4 : win.y + (3 * win.h) / 4;
  const inLane = (r: Rect) => (along ? r.x < hi && r.x + r.w > lo : r.y < hi && r.y + r.h > lo);
  // Wholly beyond the window on that side. The wall the window itself lies in overlaps it and counts for neither.
  const before = others.some((r) => inLane(r) && (along ? r.y + r.h <= win.y : r.x + r.w <= win.x));
  const after = others.some((r) => inLane(r) && (along ? r.y >= win.y + win.h : r.x >= win.x + win.w));
  const [first, second]: [Side, Side] = along ? ["up", "down"] : ["left", "right"];
  if (before !== after) return before ? second : first;
  const box = bounds(plan.walls);
  if (!box) return null;
  const mid = along ? win.y + win.h / 2 : win.x + win.w / 2, centre = along ? box.y + box.h / 2 : box.x + box.w / 2;
  return mid === centre ? null : mid < centre ? first : second;
}

export type Facing = { win: PlanWindow; side: Side; point: CompassPoint };

/** Every window whose outdoor side could be told, with the compass point it looks towards. Empty when the plan has no bearing. */
export function windowFacings(plan: PlanData): Facing[] {
  const bearing = plan.bearing;
  if (bearing === undefined) return [];
  return plan.windows.flatMap((win) => {
    const side = outsideOf(win, plan);
    return side ? [{ win, side, point: compassPoint(sideBearing(side, bearing)) }] : [];
  });
}

/** The compass points the flat has windows towards, clockwise from north, each once. */
export const facedPoints = (facings: Facing[]): CompassPoint[] => COMPASS.filter((p) => facings.some((f) => f.point === p));
