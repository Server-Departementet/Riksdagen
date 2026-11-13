import type { Dim, Fixture, Item, Label, PlanData, PlanWindow, Wall } from "@/lib/planner/plan";
import { COLORS, clamp, dropLoneGroups, uid } from "@/lib/planner/plan";
import { bounds, itemBox, parkBox } from "@/lib/planner/geometry";

/*
 * Every change to a plan, as a pure function returning a new plan. The planner
 * keeps earlier plans for undo, so nothing here may change its input.
 */

/** One of the drawn (non-furniture) things in a plan. */
export type StaticKind = "walls" | "windows" | "fixtures" | "dims" | "labels";
export type StaticRef = { kind: StaticKind; id: string };
export type StaticElement = Wall | PlanWindow | Fixture | Dim | Label;

const withItems = (plan: PlanData, items: Item[]): PlanData => {
  const copy = items.map((i) => ({ ...i }));
  dropLoneGroups(copy);
  return { ...plan, items: copy };
};
const mapChosen = (plan: PlanData, ids: ReadonlySet<string>, fn: (it: Item) => Item) =>
  withItems(plan, plan.items.map((i) => (ids.has(i.id) ? fn(i) : i)));

/** Turn the pieces 90° clockwise around their common centre, as one rigid block. */
export function rotateItems(plan: PlanData, ids: ReadonlySet<string>): PlanData {
  const b = bounds(plan.items.filter((i) => ids.has(i.id)).map(itemBox));
  if (!b) return plan;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return mapChosen(plan, ids, (it) => ({ ...it, x: cx - (it.y - cy), y: cy + (it.x - cx), a: ((it.a + 90) % 360) as Item["a"] }));
}

export const removeItems = (plan: PlanData, ids: ReadonlySet<string>) => withItems(plan, plan.items.filter((i) => !ids.has(i.id)));

/** Copies land a little down and to the right. Copies of a group form a new group of their own. */
export function duplicateItems(plan: PlanData, ids: ReadonlySet<string>): { plan: PlanData; ids: string[] } {
  const groups = new Map<string, string>();
  const copies = plan.items.filter((i) => ids.has(i.id)).map((it): Item => {
    if (it.g && !groups.has(it.g)) groups.set(it.g, uid());
    return { ...it, id: uid(), x: it.x + 20, y: it.y + 20, ...(it.g ? { g: groups.get(it.g) } : {}) };
  });
  return { plan: withItems(plan, [...plan.items, ...copies]), ids: copies.map((c) => c.id) };
}

export function groupItems(plan: PlanData, ids: ReadonlySet<string>): PlanData {
  if (ids.size < 2) return plan;
  const g = uid();
  return mapChosen(plan, ids, (it) => ({ ...it, g }));
}

export const ungroupItems = (plan: PlanData, ids: ReadonlySet<string>) =>
  mapChosen(plan, ids, (it) => { const { g: _g, ...rest } = it; return rest; });

export const patchItems = (plan: PlanData, ids: ReadonlySet<string>, patch: Partial<Omit<Item, "id" | "g">>) =>
  mapChosen(plan, ids, (it) => ({ ...it, ...patch }));

export const nudgeItems = (plan: PlanData, ids: ReadonlySet<string>, dx: number, dy: number) =>
  mapChosen(plan, ids, (it) => ({ ...it, x: it.x + dx, y: it.y + dy }));

/** New pieces land in the parking box, stepping down so several in a row don't stack exactly. */
export function addItem(plan: PlanData, piece: { name: string; w: number; d: number; h: number }): { plan: PlanData; id: string } {
  const park = parkBox(plan), n = plan.items.length;
  const it: Item = {
    id: uid(), name: piece.name.slice(0, 30), w: clamp(Math.round(piece.w), 5, 600), d: clamp(Math.round(piece.d), 5, 600),
    h: clamp(Math.round(piece.h), 1, 300), model: "block", a: 0, color: COLORS[n % COLORS.length] ?? COLORS[0],
    x: park.x + park.w / 2, y: park.y + 30 + (n % 8) * 12 + piece.d / 2,
  };
  return { plan: withItems(plan, [...plan.items, it]), id: it.id };
}

export function findStatic(plan: PlanData, ref: StaticRef | null): StaticElement | null {
  if (!ref) return null;
  const all: StaticElement[] = plan[ref.kind];
  return all.find((e) => e.id === ref.id) ?? null;
}

export function removeStatic(plan: PlanData, ref: StaticRef): PlanData {
  switch (ref.kind) {
    case "walls": return { ...plan, walls: plan.walls.filter((e) => e.id !== ref.id) };
    case "windows": return { ...plan, windows: plan.windows.filter((e) => e.id !== ref.id) };
    case "fixtures": return { ...plan, fixtures: plan.fixtures.filter((e) => e.id !== ref.id) };
    case "dims": return { ...plan, dims: plan.dims.filter((e) => e.id !== ref.id) };
    case "labels": return { ...plan, labels: plan.labels.filter((e) => e.id !== ref.id) };
  }
}

/** Change fields of one drawn thing. Fields the thing doesn't have are the caller's mistake and simply ride along unused. */
export function patchStatic(plan: PlanData, ref: StaticRef, patch: Partial<Wall & PlanWindow & Fixture & Dim & Label>): PlanData {
  const { id: _id, ...rest } = patch;
  const apply = <T extends { id: string }>(list: T[]): T[] => list.map((e) => (e.id === ref.id ? { ...e, ...rest } : e));
  switch (ref.kind) {
    case "walls": return { ...plan, walls: apply(plan.walls) };
    case "windows": return { ...plan, windows: apply(plan.windows) };
    case "fixtures": return { ...plan, fixtures: apply(plan.fixtures) };
    case "dims": return { ...plan, dims: apply(plan.dims) };
    case "labels": return { ...plan, labels: apply(plan.labels) };
  }
}

export function nudgeStatic(plan: PlanData, ref: StaticRef, dx: number, dy: number): PlanData {
  const el = findStatic(plan, ref);
  if (!el) return plan;
  if ("x1" in el) return patchStatic(plan, ref, { x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy });
  return patchStatic(plan, ref, { x: el.x + dx, y: el.y + dy });
}
