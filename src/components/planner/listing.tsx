"use client";

import { useRef, useState } from "react";
import type { Listing } from "@/lib/planner/listing";
import {
  MAX_FLOOR, MAX_LANDLORD, MAX_LISTING_NOTE, MAX_LISTING_URL, MAX_RENT, MAX_ROOMS, MIN_FLOOR, MIN_ROOMS,
  briefText, cleanListingUrl, kronor, dateText, deadlineInfo, floorText, rentText, roomsText, sanitizeListing, setFact, today,
} from "@/lib/planner/listing";
import { inputClass } from "@/components/planner/controls";

/* Everything the side panel shows about the listing a flat came from: the owner's collapsible "Annons" section
   and the read-only summary. All of it is text somebody else wrote (a landlord, an AI reading a web page), so it
   is only ever rendered as text, and the link only when it is https. */

const labelClass = "flex flex-col gap-0.5 text-xs text-gray-600 font-normal min-w-0";

/** The line that must not be missed: the deadline when it is close or gone. Nothing while it is far off or unknown. */
function DeadlineNotice({ deadline, todayIso }: { deadline: string | undefined; todayIso: string }) {
  if (!deadline) return null;
  const info = deadlineInfo(deadline, todayIso);
  if (info.state === "open") return null;
  return <p role="status" className={`text-sm font-semibold rounded-md border px-2 py-1 ${info.state === "closed" ? "border-gray-300 bg-gray-100 text-gray-700" : "border-orange-300 bg-orange-50 text-orange-900"}`}>
    {info.text}{info.state === "soon" && <span className="font-normal"> ({dateText(deadline, todayIso)})</span>}
  </p>;
}

/** The link to the listing, named by its site. Nothing unless the stored link still passes as https. */
function ListingLink({ url }: { url: string | undefined }) {
  const href = cleanListingUrl(url);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-normal underline text-orange-800 break-all self-start">
    Annonsen på {new URL(href).hostname.replace(/^www\./, "")} ↗
  </a>;
}

/** The listing's facts for someone who can't edit them. Nothing when the plan has none. */
export function ListingInfo({ listing }: { listing: Listing | undefined }) {
  if (!listing) return null;
  const todayIso = today();
  const facts = [
    listing.rent === undefined ? "" : rentText(listing.rent),
    listing.rooms === undefined ? "" : roomsText(listing.rooms),
    listing.floor === undefined ? "" : floorText(listing.floor),
  ].filter(Boolean);
  // A close or passed deadline is said by the notice instead.
  const far = listing.deadline !== undefined && deadlineInfo(listing.deadline, todayIso).state === "open";
  const dates = [
    listing.moveIn === undefined ? "" : `Inflyttning ${dateText(listing.moveIn, todayIso)}`,
    far && listing.deadline ? deadlineInfo(listing.deadline, todayIso).text : "",
  ].filter(Boolean);
  return <div className="flex flex-col gap-1 text-sm font-normal">
    <DeadlineNotice deadline={listing.deadline} todayIso={todayIso} />
    {facts.length > 0 && <p><span className="font-semibold">{facts[0]}</span>{facts.slice(1).map((f) => ` · ${f}`).join("")}</p>}
    {dates.length > 0 && <p>{dates.join(" · ")}</p>}
    {listing.landlord && <p className="text-gray-600 break-words">Hyresvärd: {listing.landlord}</p>}
    {listing.note && <p className="text-gray-600 whitespace-pre-wrap break-words">{listing.note}</p>}
    <ListingLink url={listing.url} />
  </div>;
}

/**
 * One fact's box. What is typed stays in the box while it has focus; the plan only gets it once `parse` accepts it
 * (null: not a value yet, undefined: emptied, which removes the fact), so a half-typed rent or link never reaches
 * the plan. `onStart` fires once per visit to the box, before its first change: one undo step per edit.
 */
function Fact<T>({ label, shown, parse, onChange, onStart, className, multiline, ...input }: {
  label: string; shown: string; parse: (text: string) => T | undefined | null; onChange: (value: T | undefined) => void; onStart: () => void;
  className?: string; multiline?: boolean; type?: "text" | "date" | "url"; inputMode?: "numeric" | "decimal" | "url"; maxLength?: number; placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const armed = useRef(false);
  const bad = draft !== null && parse(draft) === null;
  const props = {
    ...input,
    "className": `${inputClass} ${bad ? "border-red-500" : ""}`,
    "value": draft ?? shown,
    "aria-invalid": bad || undefined,
    "onFocus": () => { setDraft(shown); armed.current = true; },
    "onBlur": () => setDraft(null),
    "onChange": (e: { target: { value: string } }) => {
      setDraft(e.target.value);
      const value = parse(e.target.value);
      if (value === null) return;
      if (armed.current) { onStart(); armed.current = false; }
      onChange(value);
    },
  };
  return <label className={`${labelClass} ${className ?? ""}`}>{label}
    {multiline ? <textarea rows={3} {...props} /> : <input type="text" {...props} />}
  </label>;
}

/** A parser for one fact: empty removes it, and what the plan's own sanitizer would drop is no value yet. */
function parser<K extends keyof Listing>(key: K, read: (text: string) => unknown): (text: string) => Listing[K] | undefined | null {
  return (text) => {
    if (text.trim() === "") return undefined;
    return sanitizeListing({ [key]: read(text.trim()) })?.[key] ?? null;
  };
}
/** A number as people type it: "4 950", "1,5", "−1". NaN when it isn't one of the `pattern`. */
const typed = (pattern: RegExp) => (text: string) => {
  const plain = text.replace(/[\s ]/g, "").replace(",", ".").replace("−", "-");
  return pattern.test(plain) ? Number(plain) : NaN;
};
const PARSE = {
  url: parser("url", (t) => t),
  rent: parser("rent", typed(/^\d+$/)),
  // Halves only: the sanitizer would round 1.3 to 1.5, which nobody typed.
  rooms: parser("rooms", typed(/^\d+(\.[05])?$/)),
  floor: parser("floor", typed(/^-?\d+$/)),
  date: parser("moveIn", (t) => t),
  landlord: parser("landlord", (t) => t),
  // Untrimmed, so the line breaks being typed survive until the sanitizer has its say.
  note: (text: string) => (text.trim() === "" ? undefined : sanitizeListing({ note: text })?.note ?? null),
};

/**
 * The owner's "Annons" section: collapsed to one line of rent and deadline, opened to a box per fact. Emptying a
 * box removes that fact, and the listing itself goes when the last one does.
 */
export function ListingField({ value, onChange, onStart }: { value: Listing | undefined; onChange: (listing: Listing | undefined) => void; onStart: () => void }) {
  const todayIso = today();
  const brief = briefText(value, todayIso);
  const set = <K extends keyof Listing>(key: K) => (v: Listing[K] | undefined) => onChange(setFact(value, key, v));
  const num = (v: number | undefined) => (v === undefined ? "" : String(v).replace(".", ","));
  return <div className="flex flex-col gap-1.5">
    <details className="border border-gray-200 rounded-md bg-white">
      <summary className="cursor-pointer select-none px-2 py-1.5 text-sm font-semibold">
        Annons <span className="font-normal text-gray-600">{brief ? `· ${brief}` : value ? "" : "· inga uppgifter än"}</span>
      </summary>
      <div className="grid grid-cols-6 gap-2 px-2 pb-2">
        <Fact label="Hyra (kr/mån)" className="col-span-2" inputMode="numeric" maxLength={9} placeholder="okänd" shown={num(value?.rent)}
          parse={PARSE.rent} onStart={onStart} onChange={set("rent")} />
        <Fact label="Rum" className="col-span-2" inputMode="decimal" maxLength={4} placeholder="t.ex. 1,5" shown={num(value?.rooms)}
          parse={PARSE.rooms} onStart={onStart} onChange={set("rooms")} />
        <Fact label="Våning" className="col-span-2" maxLength={3} placeholder="0 = bv" shown={num(value?.floor)}
          parse={PARSE.floor} onStart={onStart} onChange={set("floor")} />
        <Fact label="Sista ansökningsdag" className="col-span-3" type="date" shown={value?.deadline ?? ""}
          parse={PARSE.date} onStart={onStart} onChange={set("deadline")} />
        <Fact label="Inflyttning" className="col-span-3" type="date" shown={value?.moveIn ?? ""}
          parse={PARSE.date} onStart={onStart} onChange={set("moveIn")} />
        <Fact label="Hyresvärd eller kö" className="col-span-6" maxLength={MAX_LANDLORD} shown={value?.landlord ?? ""}
          parse={PARSE.landlord} onStart={onStart} onChange={set("landlord")} />
        <Fact label="Länk till annonsen (https://…)" className="col-span-6" type="url" inputMode="url" maxLength={MAX_LISTING_URL} placeholder="https://" shown={value?.url ?? ""}
          parse={PARSE.url} onStart={onStart} onChange={set("url")} />
        <Fact label="Anteckning" className="col-span-6" multiline maxLength={MAX_LISTING_NOTE} shown={value?.note ?? ""}
          parse={PARSE.note} onStart={onStart} onChange={set("note")} />
        <p className="col-span-6 text-xs text-gray-500 font-normal">
          Töm en ruta för att ta bort uppgiften. Rum i halva steg ({String(MIN_ROOMS).replace(".", ",")}–{MAX_ROOMS}), våning {MIN_FLOOR} till {MAX_FLOOR}, hyra högst {kronor(MAX_RENT)}.
        </p>
      </div>
    </details>
    <DeadlineNotice deadline={value?.deadline} todayIso={todayIso} />
    <ListingLink url={value?.url} />
  </div>;
}
