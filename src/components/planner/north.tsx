"use client";

import { useRef, useState } from "react";
import type { PlanData } from "@/lib/planner/plan";
import { MAX_BEARING } from "@/lib/planner/plan";
import { drawingBox } from "@/lib/planner/geometry";
import { COMPASS, LIGHT, compassPoint, facedPoints, northAngle, windowFacings } from "@/lib/planner/compass";
import { inputClass } from "@/components/planner/controls";

/* Everything the planner shows about which way the flat faces: the north arrow and the window labels on the 2D
   stage, the owner's field for it and the line about the windows in the side panel. */

// The stage's own colours (PALETTE in stage.tsx), repeated here because the stage imports this file.
const INK = "#1d1b18", MUTED = "#6b655c", PAPER = "#fffdf8", BACKDROP = "#f4f1ec";

/** Radius of the north arrow's circle, in cm. With its 2 cm clearance it fits the 25 cm margin exports leave around the drawing. */
const R = 11;

/**
 * The north arrow, above the drawing's top right corner: off the flat and its measurements, inside the export
 * frame, and away from the area caption, which is under the bottom left corner. Nothing when the bearing is unknown.
 */
export function NorthArrow({ plan }: { plan: PlanData }) {
  if (plan.bearing === undefined) return null;
  const frame = drawingBox(plan, false), cx = frame.x + frame.w - R, cy = frame.y - R - 2;
  // The letter stays upright whichever way the arrow turns, so it sits behind the arrowhead on a line through the centre.
  const a = (northAngle(plan.bearing) * Math.PI) / 180, nx = Math.sin(a), ny = -Math.cos(a);
  return <g transform={`translate(${cx} ${cy})`} style={{ pointerEvents: "none" }}>
    <title>Norr</title>
    <circle r={R} fill={PAPER} stroke={MUTED} strokeWidth={1} />
    <path d="M0 -10L4.6 0.5L0 -1.6L-4.6 0.5Z" fill={INK} transform={`rotate(${northAngle(plan.bearing)})`} />
    <text x={-nx * 5.6} y={-ny * 5.6 + 2.6} textAnchor="middle" fontSize={7.5} fill={INK} style={{ fontWeight: 700 }}>N</text>
  </g>;
}

/** The compass point each window looks towards, written just outside it. */
export function WindowFacings({ plan }: { plan: PlanData }) {
  const facings = windowFacings(plan);
  if (!facings.length) return null;
  return <g style={{ pointerEvents: "none" }}>
    {facings.map(({ win, side, point }) => {
      const mx = win.x + win.w / 2, my = win.y + win.h / 2;
      const [x, y, anchor] = side === "up" ? [mx, win.y - 5, "middle"] as const
        : side === "down" ? [mx, win.y + win.h + 12, "middle"] as const
          : side === "left" ? [win.x - 4, my + 3.5, "end"] as const
            : [win.x + win.w + 4, my + 3.5, "start"] as const;
      // The outline keeps it readable where a measurement line passes behind it.
      return <text key={win.id} x={x} y={y} textAnchor={anchor} fontSize={10} fill={INK} stroke={BACKDROP} strokeWidth={2.5} paintOrder="stroke"
        style={{ fontWeight: 700 }}>{point}</text>;
    })}
  </g>;
}

/**
 * The owner's control for which way the plan is turned: the bearing of "up" in degrees, or one of the eight compass
 * points. Emptying the box makes the direction unknown again. `onStart` fires before a change, once per visit to
 * the box and once per button press, so each is one undo step.
 */
export function NorthField({ value, onChange, onStart }: { value: number | undefined; onChange: (bearing: number | undefined) => void; onStart: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const armed = useRef(false);
  const shown = value === undefined ? "" : String(value);
  const chip = "flex-1 border border-gray-300 rounded-md py-1 text-xs font-semibold";
  return <div className="flex flex-col gap-1">
    <div className="flex gap-2 items-end">
      <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal min-w-0 w-28 flex-none">Uppåt är (° från norr)
        <input type="text" inputMode="numeric" maxLength={3} placeholder="okänt" className={inputClass} value={draft ?? shown}
          onFocus={() => { setDraft(shown); armed.current = true; }}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            setDraft(e.target.value);
            const text = e.target.value.trim(), deg = Number(text);
            // 360 is north too; it is stored as 0.
            if (text !== "" && !(/^\d+$/.test(text) && deg <= MAX_BEARING + 1)) return;
            if (armed.current) { onStart(); armed.current = false; }
            onChange(text === "" ? undefined : deg % 360);
          }} />
      </label>
      <p className="text-sm text-gray-600 font-normal pb-1.5 min-w-0">
        {value === undefined ? "Väderstreck okänt" : `Norr är ${NORTH_IS[Math.round(northAngle(value) / 45) % 8] ?? ""} på ritningen`}
      </p>
    </div>
    <div className="flex gap-1" role="group" aria-label="Uppåt på ritningen är">
      {COMPASS.map((point, i) => (
        <button key={point} type="button" aria-pressed={value === i * 45} title={`Uppåt på ritningen är ${POINT_NAMES[i] ?? point}`}
          className={`${chip} ${value === i * 45 ? "bg-orange-700 border-orange-700 text-white" : "bg-gray-100 hover:border-gray-500"}`}
          onClick={() => { onStart(); onChange(i * 45); }}>{point}</button>
      ))}
      <button type="button" disabled={value === undefined} title="Ta bort väderstrecket" aria-label="Ta bort väderstrecket"
        className={`${chip} bg-gray-100 hover:border-gray-500 disabled:opacity-45 disabled:cursor-not-allowed`}
        onClick={() => { onStart(); onChange(undefined); }}>✕</button>
    </div>
  </div>;
}

const POINT_NAMES = ["norr", "nordost", "öst", "sydost", "söder", "sydväst", "väst", "nordväst"];
/** Where on the drawing north is, by the arrow's turn in steps of 45° clockwise from up. */
const NORTH_IS = ["uppåt", "snett upp åt höger", "åt höger", "snett ned åt höger", "nedåt", "snett ned åt vänster", "åt vänster", "snett upp åt vänster"];

/** Which way the windows look and what light that gives, for owner and visitors alike. Nothing without a bearing or without windows. */
export function SunInfo({ plan }: { plan: PlanData }) {
  const points = facedPoints(windowFacings(plan));
  if (plan.bearing === undefined) return null;
  if (!points.length) return <p className="text-sm text-gray-600 font-normal">Uppåt på ritningen är {compassPoint(plan.bearing)}.</p>;
  return <p className="text-sm font-normal">
    Fönster mot: {points.map((p, i) => <span key={p}>{i > 0 && ", "}<span className="font-semibold">{p}</span> ({LIGHT[p]})</span>)}
    <span className="block text-xs text-gray-500">Ungefärligt: årstid, våning, balkonger och hus intill avgör hur mycket sol som når in.</span>
  </p>;
}
