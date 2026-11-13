import type { Item, PlanData } from "@/lib/planner/plan";
import type { Stacking } from "@/lib/planner/geometry";
import { blocksDoor, inFlat, isHit, stacking } from "@/lib/planner/geometry";
import { unpacked } from "@/lib/planner/edit";

/*
 * "Does my furniture fit?": how the furnishing of one plan stands, for the plan picker and the line under it.
 * Pure, so the server works it out for the whole plan list and the browser for the plan being edited.
 * It goes by `plan.items` only: the arrangement being shown.
 */

/**
 * "empty": the plan has no furniture. "problems": some placed piece collides or is in a door's way.
 * "unplaced": no problems, but some piece is still in the parking box (or, in one's own plan, still in
 * "Mina möbler"). "fits": every piece is placed without a warning.
 */
export type FitVerdict = "empty" | "fits" | "unplaced" | "problems";
export type Fit = {
  verdict: FitVerdict;
  /** Pieces standing in the flat */
  placed: number;
  /** Pieces in the plan that are still outside the flat */
  unplaced: number;
  /** Placed pieces that overlap something or block a door: the ones the furniture list flags */
  problems: number;
  /** Pieces of the viewer's "Mina möbler" the plan lacks. Only on the viewer's own plans, and only when that list is known. */
  missing?: number;
};

/**
 * `furniture` is the viewer's "Mina möbler" when the plan is their own, and left out otherwise: someone else's
 * plan is judged by the pieces it holds, one's own also by whether the whole list has been brought in.
 */
export function fitOf(plan: PlanData, furniture?: Item[], stack: Stacking = stacking(plan)): Fit {
  let placed = 0, problems = 0;
  for (const it of plan.items) {
    // A piece in the parking box is not a problem yet, whatever it happens to lie on top of there.
    if (!inFlat(plan, it)) continue;
    placed++;
    if (isHit(plan, it, stack) || blocksDoor(plan, it, stack)) problems++;
  }
  const unplaced = plan.items.length - placed;
  const missing = furniture ? unpacked(plan, furniture).length : undefined;
  // An empty plan stays "empty" however long the list is: nothing has been tried in it yet.
  const verdict = !plan.items.length ? "empty" : problems ? "problems" : unplaced || missing ? "unplaced" : "fits";
  return { verdict, placed, unplaced, problems, ...(missing === undefined ? {} : { missing }) };
}

/** Leads the plan's name in the picker, where an option can hold nothing but text. */
export const FIT_SYMBOL: Record<FitVerdict, string> = { empty: "·", fits: "✓", unplaced: "◐", problems: "⚠" };
/** The symbol in words, for screen readers and the picker's tooltip. */
export const FIT_LABEL: Record<FitVerdict, string> = {
  empty: "inga möbler än", fits: "möblerna får plats", unplaced: "möbler återstår att placera", problems: "möbler överlappar eller blockerar en dörr",
};
export const FIT_LEGEND = (["fits", "unplaced", "problems", "empty"] as const).map((v) => `${FIT_SYMBOL[v]} ${FIT_LABEL[v]}`).join("\n");

const pieces = (n: number) => (n === 1 ? "1 möbel" : `${n} möbler`);

/** The verdict as a sentence. Never claims more than was checked: "får plats" is every piece placed with no warning. */
export function fitText(fit: Fit): string {
  const missing = fit.missing ?? 0, out = fit.unplaced + missing, all = fit.placed + out;
  if (fit.verdict === "empty") return "Inga möbler än";
  if (fit.verdict === "fits") return all === 1 ? "Möbeln får plats" : `Alla ${all} möbler får plats`;
  const waiting = `${out} av ${pieces(all)} är inte ${out === 1 ? "utplacerad" : "utplacerade"}${missing ? ` (${missing} ligger kvar i Mina möbler)` : ""}`;
  if (fit.verdict === "unplaced") return waiting;
  return `${pieces(fit.problems)} överlappar eller blockerar en dörr${out ? ` · ${waiting}` : ""}`;
}
