/*
 * The flat planner's document format, shared by the browser and the API routes.
 * Everything is in centimetres. The plan image, when there is one, sits at
 * (image.x, image.y) and is image.w × image.h pixels at image.cmPerPx
 * (its height times image.stretch, when the picture's two directions differ in scale).
 * All shapes are axis-aligned rectangles; furniture turns in 90° steps.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type Wall = Rect & { id: string };
/** Drawn across a wall. `sill` and `head` are heights above the floor, for the 3D view. */
export type PlanWindow = Rect & { id: string; sill: number; head: number };
/**
 * A door or doorway. The rectangle is the opening, lying in the wall line like a window: as thick as the wall,
 * as long as the opening is wide. The wall runs along the rectangle's longer side.
 * `hinge` is the end of the opening the leaf hangs at: "start" is the left end in a wall running left–right and
 * the top end in a wall running up–down; "end" is the right or bottom end.
 * `swing` is the side of the wall the leaf opens to: "neg" towards smaller coordinates (up from a left–right
 * wall, left from an up–down wall), "pos" the other way. "none" is a sliding door or an open doorway: it marks
 * the passage but sweeps over no floor.
 */
export type Door = Rect & { id: string; hinge: "start" | "end"; swing: "neg" | "pos" | "none" };
/** Built-in things furniture can't overlap: kitchen units, wardrobes, fridge. */
/**
 * `height` is the fitting's own height. `lift` is how far above the floor it starts, for what hangs on
 * the wall (wall cabinets, a hat shelf): the floor under it is free for anything that fits.
 */
export type Fixture = Rect & { id: string; label: string; height: number; lift?: number };
/** A measurement line. Shows its own length unless `text` says otherwise. */
export type Dim = { id: string; x1: number; y1: number; x2: number; y2: number; text: string; flip: boolean };
export type Label = { id: string; x: number; y: number; text: string };

export type Angle = 0 | 90 | 180 | 270;
/**
 * The shapes a piece of furniture can have in the 3D view. A block is a solid box; a table is a top on
 * four legs, with room underneath. The chairs have their back along the edge that is at the top of the
 * plan before the piece is turned. A cylinder is an upright ellipse inscribed in the footprint (a round
 * rug, a pouffe); only its drawing is round: collisions, snapping, gaps and stacking still go by the
 * `w` × `d` box, so two round pieces can't nestle into each other's corners.
 */
export const ITEM_MODELS = ["block", "table", "chair", "office-chair", "cylinder"] as const;
export type ItemModel = (typeof ITEM_MODELS)[number];
/**
 * How a piece is stacked when the automatic guess is wrong. "floor": never lifted onto anything. "top": on
 * whatever it overlaps, never under it. "under": on the floor beneath a table or a raised piece it overlaps.
 */
export const STACK_MODES = ["floor", "top", "under"] as const;
export type StackMode = (typeof STACK_MODES)[number];
export type Item = {
  id: string;
  name: string;
  /** Width and depth before rotation */
  w: number;
  d: number;
  /** Height, for the 3D view */
  h: number;
  /** How the piece is drawn in the 3D view, see ITEM_MODELS */
  model: ItemModel;
  /** Centre */
  x: number;
  y: number;
  a: Angle;
  color: string;
  /** Pieces sharing a group id move as one */
  g?: string;
  /** Overrules the automatic stacking, see STACK_MODES. Absent: automatic. */
  stack?: StackMode;
  /** Height above the floor the piece is fixed at, like a wall shelf. Absent: it stands on the floor or on what it is stacked on. */
  lift?: number;
};

/**
 * A furnishing variant: one named arrangement of the flat's furniture ("Säng vid fönstret"). A plan can hold
 * several to flip between. Only the ones NOT being shown are stored like this, see PlanData.variants.
 */
export type Variant = { id: string; name: string; items: Item[] };

export type PlanImage = {
  w: number;
  h: number;
  /** Centimetres per pixel, horizontally. Vertically too unless `stretch` says otherwise. */
  cmPerPx: number;
  /**
   * The vertical scale as a multiple of the horizontal one, MIN_STRETCH–MAX_STRETCH: a pixel is `cmPerPx` wide and
   * `cmPerPx * stretch` high. For a picture that is squeezed in one direction, set by correcting the drawing's width
   * and height separately. Left out when the picture has one scale, as every picture had before this existed.
   */
  stretch?: number;
  x: number;
  y: number;
  /** Changes with every upload, to get past the browser cache */
  rev: number;
  /** False until the owner has set the scale from a known distance */
  calibrated: boolean;
};

export type PlanData = {
  v: 1;
  image: PlanImage | null;
  walls: Wall[];
  windows: PlanWindow[];
  /** Absent in plans drawn before there were doors, where a doorway is only a gap between two walls. */
  doors?: Door[];
  fixtures: Fixture[];
  dims: Dim[];
  labels: Label[];
  items: Item[];
  /**
   * Furnishing variants. `items` above is always the furniture of the variant being shown, so everything that reads
   * a plan's furniture works without knowing variants exist. `variant` names the shown one; `variants` holds the
   * others, at most MAX_VARIANTS - 1. `at` is where the shown one goes among them in the picker, so the order stays
   * put when switching: the full list is variants[0..at), the shown one, variants[at..]. Both are left out in a
   * plan with one unnamed arrangement, as every plan was before variants existed; `variants` is never present
   * without `variant`, and never empty. The edit functions are in variants.ts.
   */
  variant?: { id: string; name: string; at: number };
  variants?: Variant[];
  /**
   * The flat's stated floor area ("boarea") in m², to one decimal, MIN_AREA–MAX_AREA. Typed by the owner, taken
   * from the listing by the AI tracer, or from the area the scale was set with. Left out when nobody has stated it:
   * it is what the flat is said to be, never worked out from the drawing.
   */
  area?: number;
  /**
   * Which way the plan is turned: the compass bearing that "up" on the plan (towards smaller y) points to, in whole
   * degrees clockwise from north, 0–359. 0: north is up. 90: up is east, so north is to the left. 180: north is
   * down. 270: up is west, north is to the right. A north arrow drawn on the plan therefore points (360 − bearing)°
   * clockwise from up. Left out when nobody has said which way north is: nothing about the sun is shown then.
   */
  bearing?: number;
};

/** What the plan list knows about each plan */
export type PlanMeta = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  /** ms epoch on the editing browser's clock */
  editedAt: number;
};

export type PlanDoc = { name: string; data: PlanData; editedAt: number };
/** GET /api/planlosning/[id] */
export type PlanResponse = PlanDoc & { id: string; ownerId: string };

/** A plan as a file: the export button writes it, the import button reads it. */
export type PlanFile = {
  format: typeof PLAN_FILE_FORMAT;
  name: string;
  data: PlanData;
  /** The plan image as a data URL */
  image?: string;
};
export const PLAN_FILE_FORMAT = "riksdagen-planlosning";

export const COLORS = ["#6d8fd6", "#d69a4c", "#c9b458", "#b784d6", "#58b89a", "#d67a8f", "#8a9099", "#a98467", "#7fb3c8"] as const;

export const PLAN_ID_REGEX = /^[a-z0-9]{6,40}$/;
export const MAX_NAME_LENGTH = 60;
export const MAX_PLANS_PER_MINISTER = 30;
export const MAX_PLAN_JSON_BYTES = 400_000;
export const MAX_IMAGE_BYTES = 5_000_000;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Furnishing variants per plan, the shown one included. See the size sums at `fitsSizeCap` in variants.ts. */
export const MAX_VARIANTS = 8;
export const MAX_VARIANT_NAME_LENGTH = 30;
export const variantName = (value: unknown): string =>
  (typeof value === "string" ? value.trim().slice(0, MAX_VARIANT_NAME_LENGTH).trim() : "") || "Namnlös variant";

/** Bounds of PlanImage.stretch */
export const MIN_STRETCH = 0.2;
export const MAX_STRETCH = 5;
/** A stretch as stored: within bounds, and absent (undefined) when it is as good as none. */
export const cleanStretch = (v: number): number | undefined => (Math.abs(v - 1) < 1e-6 ? undefined : clamp(v, MIN_STRETCH, MAX_STRETCH));

/** Bounds of PlanData.area, in m² */
export const MIN_AREA = 1;
export const MAX_AREA = 2000;
/** An area in m² as Swedes write it: "38 m²", "38,5 m²". */
export const areaText = (m2: number) => `${m2.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m²`;

/** PlanData.bearing is a whole number of degrees from 0 to this. */
export const MAX_BEARING = 359;

export const DEFAULT_SILL = 90;
export const DEFAULT_HEAD = 210;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function emptyPlan(): PlanData {
  return { v: 1, image: null, walls: [], windows: [], fixtures: [], dims: [], labels: [], items: [] };
}

export function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim().slice(0, MAX_NAME_LENGTH) : "";
  return name || "Namnlös planlösning";
}

// ---------- sanitizing
// Anything read from the network, localStorage or an imported file goes through
// here, on the server as well as in the browser.

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown, max: number): Raw[] => (Array.isArray(v) ? v.filter(isObject).slice(0, max) : []);
const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
const coord = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(clamp(v, -20_000, 20_000) * 10) / 10 : null);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const id = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : null);

function rect(r: Raw): (Rect & { id: string }) | null {
  const rid = id(r.id), x = coord(r.x), y = coord(r.y), w = coord(r.w), h = coord(r.h);
  if (rid === null || x === null || y === null || w === null || h === null || w < 1 || h < 1) return null;
  return { id: rid, x, y, w: Math.min(w, 5000), h: Math.min(h, 5000) };
}

function compact<T>(values: (T | null)[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of values) {
    if (v === null) continue;
    const key = (v as { id: string }).id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** A list of furniture, as in a plan's `items`. */
export function sanitizeItems(input: unknown): Item[] {
  const items = compact(list(input, 200).map((r): Item | null => {
    const rid = id(r.id), x = coord(r.x), y = coord(r.y);
    if (rid === null || x === null || y === null) return null;
    const a = r.a === 90 || r.a === 180 || r.a === 270 ? r.a : 0;
    const g = id(r.g), stack = STACK_MODES.find((m) => m === r.stack);
    return {
      id: rid, name: str(r.name, 30),
      w: Math.round(num(r.w, 5, 600, 60)), d: Math.round(num(r.d, 5, 600, 60)), h: Math.round(num(r.h, 1, 300, 75)),
      // Plans saved before there were models only knew "open underneath", which was the table.
      model: ITEM_MODELS.find((m) => m === r.model) ?? (r.open === true ? "table" : "block"), x, y, a,
      color: typeof r.color === "string" && /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : COLORS[0],
      ...(g ? { g } : {}),
      ...(stack ? { stack } : {}),
      ...(typeof r.lift === "number" && Number.isFinite(r.lift) ? { lift: Math.round(clamp(r.lift, 0, 300)) } : {}),
    };
  }));
  dropLoneGroups(items);
  return items;
}

/** How many pieces "Mina möbler" can hold */
export const MAX_FURNITURE = 100;

/**
 * A minister's own furniture ("Mina möbler"): the pieces they own, kept apart from any plan so they
 * can be unpacked into each one. Same shape as a plan's items, minus everything about where a piece
 * stands: position, rotation, group and height above the floor belong to a plan.
 */
export function sanitizeFurniture(input: unknown): Item[] {
  return sanitizeItems(input).slice(0, MAX_FURNITURE).map(({ g: _g, lift: _lift, ...it }) => ({ ...it, x: 0, y: 0, a: 0 as const }));
}

export function sanitizePlan(input: unknown): PlanData {
  const src = isObject(input) ? input : {};
  const plan = emptyPlan();

  if (isObject(src.image)) {
    const i = src.image;
    const w = num(i.w, 1, 10_000, 0), h = num(i.h, 1, 10_000, 0), cmPerPx = num(i.cmPerPx, 0.001, 1000, 0);
    if (w && h && cmPerPx) {
      const stretch = typeof i.stretch === "number" && Number.isFinite(i.stretch) && i.stretch > 0 ? cleanStretch(i.stretch) : undefined;
      plan.image = {
        w: Math.round(w), h: Math.round(h), cmPerPx,
        x: coord(i.x) ?? 0, y: coord(i.y) ?? 0,
        rev: Math.round(num(i.rev, 0, Number.MAX_SAFE_INTEGER, 0)),
        calibrated: i.calibrated === true,
        ...(stretch === undefined ? {} : { stretch }),
      };
    }
  }

  plan.walls = compact(list(src.walls, 300).map(rect));
  plan.windows = compact(list(src.windows, 60).map((r) => {
    const base = rect(r);
    if (!base) return null;
    const sill = Math.round(num(r.sill, 0, 300, DEFAULT_SILL));
    return { ...base, sill, head: Math.round(num(r.head, sill + 1, 400, Math.max(DEFAULT_HEAD, sill + 1))) };
  }));
  const doors = compact(list(src.doors, 100).map((r): Door | null => {
    const base = rect(r);
    // A door that doesn't say which way it opens is taken not to swing, rather than flagging furniture on a guess.
    return base && { ...base, hinge: r.hinge === "end" ? "end" : "start", swing: r.swing === "neg" || r.swing === "pos" ? r.swing : "none" };
  }));
  if (doors.length) plan.doors = doors;
  plan.fixtures = compact(list(src.fixtures, 100).map((r) => {
    const base = rect(r);
    const lift = Math.round(num(r.lift, 0, 300, 0));
    return base && { ...base, label: str(r.label, 30), height: Math.round(num(r.height, 1, 400, 210)), ...(lift > 0 ? { lift } : {}) };
  }));
  plan.dims = compact(list(src.dims, 100).map((r) => {
    const rid = id(r.id), x1 = coord(r.x1), y1 = coord(r.y1), x2 = coord(r.x2), y2 = coord(r.y2);
    if (rid === null || x1 === null || y1 === null || x2 === null || y2 === null) return null;
    return { id: rid, x1, y1, x2, y2, text: str(r.text, 40), flip: r.flip === true };
  }));
  plan.labels = compact(list(src.labels, 100).map((r) => {
    const rid = id(r.id), x = coord(r.x), y = coord(r.y);
    if (rid === null || x === null || y === null) return null;
    return { id: rid, x, y, text: str(r.text, 40) };
  }));
  plan.items = sanitizeItems(src.items);
  Object.assign(plan, sanitizeVariants(src));
  // Out of bounds means a typo or another unit, so it is dropped rather than clamped to a number nobody stated.
  if (typeof src.area === "number" && src.area >= MIN_AREA && src.area <= MAX_AREA) plan.area = Math.round(src.area * 10) / 10;
  // 360 is north again. Anything else out of range is no compass bearing, so the direction stays unknown.
  if (typeof src.bearing === "number" && src.bearing >= 0 && src.bearing <= 360) plan.bearing = Math.round(src.bearing) % 360;
  return plan;
}

/** The furnishing variants of a raw plan: nothing at all for a plan without any, as plans were before variants. */
function sanitizeVariants(src: Raw): Pick<PlanData, "variant" | "variants"> {
  const shown = isObject(src.variant) ? src.variant : null, shownId = shown && id(shown.id);
  // A stored variant sharing the shown one's id could never be switched to, so it goes. Read with some slack, so a
  // few such duds don't push good variants out; the count is cut to size afterwards.
  const hidden = compact(list(src.variants, MAX_VARIANTS * 4).map((r): Variant | null => {
    const rid = id(r.id);
    return rid === null || rid === shownId ? null : { id: rid, name: variantName(r.name), items: sanitizeItems(r.items) };
  })).slice(0, MAX_VARIANTS - 1);
  if (!shown && !hidden.length) return {};
  // Stored variants need a shown one to switch back to. Its made-up id must come out the same every time the plan is read.
  const fallback = ["v0", ...hidden.map((_, i) => `v${i + 1}`)].find((v) => hidden.every((h) => h.id !== v)) ?? "v0";
  const at = Math.round(num(shown?.at, 0, hidden.length, 0));
  return { variant: { id: shownId ?? fallback, name: variantName(shown?.name), at }, ...(hidden.length ? { variants: hidden } : {}) };
}

/** A group needs at least two members; the tag comes off any piece left on its own. */
export function dropLoneGroups(items: Item[]): void {
  const size = new Map<string, number>();
  for (const i of items) if (i.g) size.set(i.g, (size.get(i.g) ?? 0) + 1);
  for (const i of items) if (i.g && (size.get(i.g) ?? 0) < 2) delete i.g;
}

/** A plan file from the export button (or converted from Hem-Scan), or null when it isn't one. */
export function parsePlanFile(input: unknown): PlanFile | null {
  if (!isObject(input) || input.format !== PLAN_FILE_FORMAT || !isObject(input.data)) return null;
  const image = typeof input.image === "string" && input.image.startsWith("data:image/") ? input.image : undefined;
  return { format: PLAN_FILE_FORMAT, name: cleanName(input.name), data: sanitizePlan(input.data), ...(image ? { image } : {}) };
}

/** The image type of a file by its first bytes, or null when it is none we accept. */
export function sniffImageType(bytes: Uint8Array): (typeof IMAGE_TYPES)[number] | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
