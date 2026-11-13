"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";

/* Small form pieces for the planner's side panel. */

export const buttonClass = "border border-gray-300 bg-gray-100 rounded-md px-2.5 py-1.5 text-sm font-semibold hover:border-gray-500 disabled:opacity-45 disabled:cursor-not-allowed";
export const primaryClass = "border border-orange-700 bg-orange-700 text-white rounded-md px-2.5 py-1.5 text-sm font-semibold hover:bg-orange-800 disabled:opacity-45 disabled:cursor-not-allowed";
export const inputClass = "w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white font-normal text-base text-gray-900";
const labelClass = "flex flex-col gap-0.5 text-xs text-gray-600 font-normal min-w-0";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border border-gray-200 rounded-xl p-3 bg-white flex flex-col gap-2.5">
    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{title}</p>
    {children}
  </section>;
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex gap-2 items-center text-sm font-normal">
    <input type="checkbox" className="accent-orange-700" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>;
}

export function Segments<T extends string>({ value, options, onChange }: { value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void }) {
  return <div className="flex flex-wrap border border-gray-300 rounded-md overflow-hidden">
    {options.map(([key, label]) => (
      <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}
        className={`flex-1 px-2 py-1.5 text-sm font-semibold whitespace-nowrap ${value === key ? "bg-orange-700 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{label}</button>
    ))}
  </div>;
}

/**
 * A number box that only reports valid whole numbers, so half-typed values never reach the plan.
 * `onStart` fires once per visit to the box, before its first change: one undo step per edit, not per keystroke.
 */
export function NumField({ label, value, min, max, onChange, onStart }: {
  label: string; value: number; min: number; max: number; onChange: (value: number) => void; onStart: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const armed = useRef(false);
  return <label className={labelClass}>{label}
    <input type="number" inputMode="numeric" min={min} max={max} step={1} className={inputClass} value={draft ?? String(Math.round(value))}
      onFocus={() => { setDraft(String(Math.round(value))); armed.current = true; }}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value === "" || !Number.isFinite(n) || n < min || n > max) return;
        if (armed.current) { onStart(); armed.current = false; }
        onChange(Math.round(n));
      }} />
  </label>;
}

export function TextField({ label, value, maxLength, placeholder, onChange, onStart }: {
  label: string; value: string; maxLength: number; placeholder?: string; onChange: (value: string) => void; onStart: () => void;
}) {
  const armed = useRef(false);
  return <label className={labelClass}>{label}
    <input type="text" maxLength={maxLength} placeholder={placeholder} className={inputClass} value={value}
      onFocus={() => { armed.current = true; }}
      onChange={(e) => {
        if (armed.current) { onStart(); armed.current = false; }
        onChange(e.target.value.slice(0, maxLength));
      }} />
  </label>;
}
