import type { Item, PlanData, Variant } from "@/lib/planner/plan";
import { MAX_PLAN_JSON_BYTES, MAX_VARIANTS, MAX_VARIANT_NAME_LENGTH, uid } from "@/lib/planner/plan";
import { parkItems } from "@/lib/planner/geometry";

/*
 * Furnishing variants: several named arrangements of furniture in one flat. See PlanData.variant for how
 * they are stored. Like the functions in edit.ts these are pure: the planner keeps earlier plans for undo,
 * and a furniture list that is only moved between `items` and `variants` is shared, never changed.
 */

/** A variant as the picker lists it. */
export type VariantRef = { id: string; name: string; shown: boolean };

/** Every variant in picker order with the shown one in its place, and where that is. */
function unfold(plan: PlanData): { all: Variant[]; at: number } {
  const hidden = plan.variants ?? [];
  // A plan from before variants is one arrangement that was never named. It gets a name the day a second one is made.
  const shown = { id: plan.variant?.id ?? uid(), name: plan.variant?.name ?? "Variant 1", items: plan.items };
  const at = Math.min(plan.variant?.at ?? 0, hidden.length);
  return { all: [...hidden.slice(0, at), shown, ...hidden.slice(at)], at };
}

/** The plan showing `all[at]`, with the rest stored away. */
function fold(plan: PlanData, all: Variant[], at: number): PlanData {
  const shown = all[at];
  if (!shown) return plan;
  const { variants: _old, ...rest } = plan, hidden = all.filter((_, i) => i !== at);
  return { ...rest, items: shown.items, variant: { id: shown.id, name: shown.name, at }, ...(hidden.length ? { variants: hidden } : {}) };
}

/** The plan's variants in picker order. Empty for a plan that has only its one unnamed arrangement. */
export function listVariants(plan: PlanData): VariantRef[] {
  if (!plan.variant) return [];
  const { all, at } = unfold(plan);
  return all.map((v, i) => ({ id: v.id, name: v.name, shown: i === at }));
}

/**
 * Whether the plan can be saved: the server refuses anything above MAX_PLAN_JSON_BYTES, and the browser would then
 * retry for ever. Measured: a piece is about 140 characters of JSON as the planner makes it (190 when it is grouped,
 * lifted and has a stacking choice), so MAX_VARIANTS variants of 100 pieces in a flat of 300 walls come to
 * 130 000–170 000, and of 200 pieces to 240 000–320 000: all fit. Only a plan filled to every limit at once does
 * not: 200 pieces with the longest ids and names full of quotes are 59 000 per variant, 490 000 for eight. Hence
 * this check when a variant is added (it stops that plan at six) rather than a lower count for everyone.
 */
export const fitsSizeCap = (plan: PlanData) => JSON.stringify(plan).length <= MAX_PLAN_JSON_BYTES - 2000; // the rest is for the plan's name and the envelope

/** Show another variant: the furniture now shown is stored away under its name. The same plan when there is no such variant. */
export function switchVariant(plan: PlanData, id: string): PlanData {
  if (!plan.variant || plan.variant.id === id) return plan;
  const { all } = unfold(plan), to = all.findIndex((v) => v.id === id);
  return to < 0 ? plan : fold(plan, all, to);
}

/**
 * A new variant, listed after the shown one and shown at once. "copy" starts from the arrangement now shown. "empty"
 * starts with the same pieces waiting in the parking box: a variant is another arrangement of the same furniture,
 * so nothing is left behind, only unplaced. Pieces keep their ids either way, which is how "Mina möbler" knows them.
 * The same plan when it is full (MAX_VARIANTS) or would grow too large to save.
 */
export function addVariant(plan: PlanData, from: "copy" | "empty", name: string): PlanData {
  const { all, at } = unfold(plan);
  if (all.length >= MAX_VARIANTS) return plan;
  let items: Item[];
  if (from === "copy") items = plan.items.map((i) => ({ ...i }));
  else {
    // Out of the flat nothing stands together any more, so the groups go, as they do when a new plan is started.
    items = plan.items.map(({ g: _g, ...it }) => ({ ...it }));
    parkItems(plan, items);
  }
  const made: Variant = { id: uid(), name: name.trim().slice(0, MAX_VARIANT_NAME_LENGTH) || `Variant ${all.length + 1}`, items };
  const next = fold(plan, [...all.slice(0, at + 1), made, ...all.slice(at + 1)], at + 1);
  return fitsSizeCap(next) ? next : plan;
}

/** Rename the shown variant. Kept as typed; the sanitizer trims it and names a variant left without one. */
export function renameVariant(plan: PlanData, name: string): PlanData {
  return plan.variant ? { ...plan, variant: { ...plan.variant, name: name.slice(0, MAX_VARIANT_NAME_LENGTH) } } : plan;
}

/**
 * Remove a variant and its arrangement. Removing the shown one shows the one after it, or before it when it was last.
 * The last variant can't be removed: the same plan comes back.
 */
export function deleteVariant(plan: PlanData, id: string): PlanData {
  const { all, at } = unfold(plan), gone = all.findIndex((v) => v.id === id);
  if (!plan.variant || all.length < 2 || gone < 0) return plan;
  const rest = all.filter((_, i) => i !== gone);
  return fold(plan, rest, gone < at ? at - 1 : Math.min(at, rest.length - 1));
}

/**
 * Take all furniture out of a plan, the stored variants' too: for a copy of someone else's plan, where furniture
 * belongs to whoever placed it. Changes the plan in place, so only for a plan just made by the sanitizer.
 */
export function stripFurniture(plan: PlanData): void {
  plan.items = [];
  delete plan.variant;
  delete plan.variants;
}
