/*
 * The facts of the housing listing a flat plan came from: what you compare when choosing between flats.
 * Typed by the plan's owner or filled in by the AI tracer from the listing. Every field is optional and only ever
 * holds what the listing states. The floor area is not here: it is the plan's own `area`.
 *
 * This file imports nothing from plan.ts, which imports it.
 */

export type Listing = {
  /** Link to the listing. Always https, at most MAX_LISTING_URL characters. */
  url?: string;
  /** Monthly rent in whole SEK, 1–MAX_RENT. */
  rent?: number;
  /** Number of rooms in steps of a half ("1,5 rum och kök"), MIN_ROOMS–MAX_ROOMS. */
  rooms?: number;
  /** The floor the flat is on, a whole number MIN_FLOOR–MAX_FLOOR. 0 is the ground floor, below that is under ground. */
  floor?: number;
  /** The day the tenancy starts, as YYYY-MM-DD. */
  moveIn?: string;
  /** The last day to apply, as YYYY-MM-DD. */
  deadline?: string;
  /** Who lets the flat, or the queue it is let through. At most MAX_LANDLORD characters. */
  landlord?: string;
  /** Anything else worth remembering about the listing. At most MAX_LISTING_NOTE characters, line breaks kept. */
  note?: string;
};

/** The part of a listing the plan list carries for every plan, see PlanMeta. */
export type ListingBrief = Pick<Listing, "rent" | "deadline">;

export const MAX_LISTING_URL = 500;
export const MAX_RENT = 200_000;
export const MIN_ROOMS = 0.5;
export const MAX_ROOMS = 20;
export const MIN_FLOOR = -5;
export const MAX_FLOOR = 100;
export const MAX_LANDLORD = 60;
export const MAX_LISTING_NOTE = 300;

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** The link as stored, or undefined when it isn't an https link short enough. It is shown to every minister, so nothing else is ever kept. */
export function cleanListingUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > MAX_LISTING_URL * 2) return undefined;
  try {
    const url = new URL(value.trim());
    // A link with a login in it is either a mistake or made to mislead about where it goes.
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.href.length <= MAX_LISTING_URL ? url.href : undefined;
  }
  catch {
    return undefined;
  }
}

/** A date as stored, or undefined when it isn't a real day written YYYY-MM-DD in a year from 2000 to 2100. */
export function cleanDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (y < 2000 || y > 2100) return undefined;
  // Date.UTC rolls 31 February over into March; a day that comes back changed never existed.
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? value : undefined;
}

/** One line of text: control characters and runs of whitespace become single spaces. */
const line = (value: unknown, max: number): string | undefined =>
  (typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f\s]+/g, " ").trim().slice(0, max).trim() : "") || undefined;

/** Free text that keeps its line breaks, at most three in a row, and loses every other control character. */
const text = (value: unknown, max: number): string | undefined =>
  (typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max).trim()
    : "") || undefined;

/**
 * A listing as stored, or undefined when nothing of it holds. Each field is judged on its own, and one that is
 * malformed or out of bounds is dropped rather than clamped: a rent or a date nobody stated is worse than none.
 */
export function sanitizeListing(input: unknown): Listing | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const src = input as Record<string, unknown>;
  const out: Listing = {};
  const url = cleanListingUrl(src.url);
  if (url) out.url = url;
  if (finite(src.rent) && Math.round(src.rent) >= 1 && Math.round(src.rent) <= MAX_RENT) out.rent = Math.round(src.rent);
  // Rooms come in halves; anything finer is noise from a conversion.
  if (finite(src.rooms) && Math.round(src.rooms * 2) / 2 >= MIN_ROOMS && src.rooms <= MAX_ROOMS) out.rooms = Math.round(src.rooms * 2) / 2;
  if (finite(src.floor) && Number.isInteger(src.floor) && src.floor >= MIN_FLOOR && src.floor <= MAX_FLOOR) out.floor = src.floor;
  const moveIn = cleanDate(src.moveIn), deadline = cleanDate(src.deadline);
  if (moveIn) out.moveIn = moveIn;
  if (deadline) out.deadline = deadline;
  const landlord = line(src.landlord, MAX_LANDLORD), note = text(src.note, MAX_LISTING_NOTE);
  if (landlord) out.landlord = landlord;
  if (note) out.note = note;
  return Object.keys(out).length ? out : undefined;
}

/** The listing with one fact set, or removed when `value` is undefined. Undefined when no fact is left. */
export function setFact<K extends keyof Listing>(listing: Listing | undefined, key: K, value: Listing[K] | undefined): Listing | undefined {
  const { [key]: _old, ...rest } = listing ?? {};
  const next: Listing = value === undefined ? rest : { ...rest, [key]: value };
  return Object.keys(next).length ? next : undefined;
}

/**
 * What the plan list shows of a plan's listing, from the plan's stored JSON. Spread into a PlanMeta: an empty
 * object when the plan has no rent and no deadline.
 */
export function listingMeta(data: unknown): { listing?: ListingBrief } {
  const raw = typeof data === "object" && data !== null ? (data as { listing?: unknown }).listing : undefined;
  const { rent, deadline } = sanitizeListing(raw) ?? {};
  if (rent === undefined && deadline === undefined) return {};
  return { listing: { ...(rent === undefined ? {} : { rent }), ...(deadline === undefined ? {} : { deadline }) } };
}

// ---------- wording, in Swedish

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const NBSP = " ";

/** "4 950 kr": thousands apart, with spaces that don't break the line. Written out by hand so server and browser agree to the character. */
export const kronor = (sek: number) => `${String(sek).replace(/\B(?=(\d{3})+$)/g, NBSP)}${NBSP}kr`;
export const rentText = (sek: number) => `${kronor(sek)}/mån`;
export const roomsText = (rooms: number) => `${String(rooms).replace(".", ",")}${NBSP}rum`;
export const floorText = (floor: number) => (floor === 0 ? "bottenvåningen" : `våning${NBSP}${floor < 0 ? "−" : ""}${Math.abs(floor)}`);

/** Today's date in Sweden as YYYY-MM-DD, whatever the clock's own time zone: the deadlines are Swedish days. */
export function today(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** "12 nov", with the year when it isn't this year's. `iso` and `todayIso` are YYYY-MM-DD. */
export function dateText(iso: string, todayIso: string = today()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const text = `${d ?? 0}${NBSP}${MONTHS[(m ?? 1) - 1] ?? ""}`;
  return iso.slice(0, 4) === todayIso.slice(0, 4) ? text : `${text}${NBSP}${y ?? ""}`;
}

/** Whole days from one YYYY-MM-DD to another; negative when `to` is the earlier. */
export function daysBetween(from: string, to: string): number {
  const utc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1); };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** How many days ahead a deadline counts as close */
export const DEADLINE_SOON_DAYS = 7;

/**
 * What to say about the last day to apply. `state` is "closed" once the day has passed (the deadline day itself is
 * still open), "soon" within DEADLINE_SOON_DAYS, else "open".
 */
export function deadlineInfo(deadline: string, todayIso: string = today()): { state: "open" | "soon" | "closed"; text: string } {
  const days = daysBetween(todayIso, deadline), date = dateText(deadline, todayIso);
  if (days < 0) return { state: "closed", text: `Ansökan stängde ${date}` };
  if (days === 0) return { state: "soon", text: "Sista ansökningsdag i dag" };
  if (days === 1) return { state: "soon", text: "Sista ansökningsdag i morgon" };
  if (days <= DEADLINE_SOON_DAYS) return { state: "soon", text: `Sista ansökningsdag om ${days} dagar` };
  return { state: "open", text: `Sista ansökningsdag ${date}` };
}

/**
 * The shortlist line for a plan: rent and last day to apply, or "" when it has neither. `short` is the form for
 * the plan picker's options, where the plan's name comes first and room is scarce.
 */
export function briefText(brief: ListingBrief | undefined, todayIso: string = today(), short = false): string {
  if (!brief) return "";
  let last = "";
  if (brief.deadline !== undefined) {
    const days = daysBetween(todayIso, brief.deadline), date = dateText(brief.deadline, todayIso);
    last = days < 0 ? `stängde ${date}` : days === 0 ? "sista dag i dag" : days === 1 ? "sista dag i morgon"
      : days <= DEADLINE_SOON_DAYS ? `sista dag om ${days} dagar` : `sista dag ${date}`;
  }
  return [brief.rent === undefined ? "" : short ? kronor(brief.rent) : rentText(brief.rent), last].filter(Boolean).join(" · ");
}
