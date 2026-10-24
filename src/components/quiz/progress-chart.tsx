"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerPoint } from "@/lib/quiz-stats";
import { SERIES_COLORS } from "@/lib/chart-colors";

type Series = { userId: string; name: string; points: PlayerPoint[] };
type Mode = "total" | "allTime" | "rate";

const HEIGHT = 320;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 44 };
// The all-time hit rate swings wildly over someone's first few votes; start the line here
const ALL_TIME_MIN_VOTES = 10;
const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function ProgressChart({ series, rollingWindow }: { series: Series[]; rollingWindow: number }) {
  const [mode, setMode] = useState<Mode>("total");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useWidth(containerRef);

  // Series arrive sorted by Discord id, so a player keeps their color whatever their rank
  const lines = useMemo(() => series.map((s, i) => ({
    ...s,
    color: SERIES_COLORS[i % SERIES_COLORS.length] ?? "#2a78d6",
    // One point per vote, so a point's index + 1 is the number of votes so far
    points: s.points.map((p, i) => ({ t: Date.parse(p.date), round: p.round, v: valueOf(mode, p, i + 1) })),
  })), [series, mode]);

  const times = lines.flatMap(l => l.points.map(p => p.t));
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const yStep = mode === "total" ? niceStep(Math.max(1, ...lines.flatMap(l => l.points.map(p => p.v ?? 0))) / 5) : 25;
  const yMax = mode === "total" ? yStep * Math.ceil(Math.max(1, ...lines.flatMap(l => l.points.map(p => p.v ?? 0))) / yStep) : 100;

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (t: number) => MARGIN.left + (tMax === tMin ? 0 : ((t - tMin) / (tMax - tMin)) * innerW);
  const y = (v: number) => MARGIN.top + innerH - (v / yMax) * innerH;

  const yTicks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, i) => i * yStep);
  const monthTicks = monthStarts(tMin, tMax);

  // Every round time, for the crosshair to snap to
  const roundTimes = useMemo(() => [...new Map(lines.flatMap(l => l.points.map(p => [p.round, p.t] as const))).entries()]
    .sort((a, b) => a[0] - b[0]), [lines]);

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    let best: number | null = null;
    for (const [, t] of roundTimes) {
      if (best === null || Math.abs(x(t) - px) < Math.abs(x(best) - px)) best = t;
    }
    setHoverTime(best);
  }

  const hovered = hoverTime === null ? null : {
    round: roundTimes.find(([, t]) => t === hoverTime)?.[0],
    rows: lines
      .map(l => {
        const point = [...l.points].reverse().find(p => p.t <= hoverTime);
        return { name: l.name, color: l.color, v: point?.v ?? null };
      })
      .filter((r): r is { name: string; color: string; v: number } => r.v !== null)
      .sort((a, b) => b.v - a.v),
  };

  const format = (v: number) => (mode === "total" ? String(Math.round(v)) : `${Math.round(v)}%`);
  const modes = [
    ["total", "Antal rätt"],
    ["allTime", "Andel rätt"],
    ["rate", `Andel rätt (senaste ${rollingWindow})`],
  ] as const;

  return <div className="flex flex-col gap-y-3">
    <div className="flex flex-row flex-wrap items-center justify-between gap-3">
      <ul className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm">
        {lines.map(l => (
          <li key={l.userId} className="flex flex-row items-center gap-x-1.5">
            <span className="inline-block w-4 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </li>
        ))}
      </ul>
      <div role="group" aria-label="Visa" className="flex flex-row text-sm border border-gray-300 rounded-sm overflow-hidden">
        {modes.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`px-3 py-1 transition-colors ${mode === value ? "bg-gray-800 text-white font-normal" : "hover:bg-gray-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div ref={containerRef} className="relative w-full">
      {width > 0 && <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={mode === "total" ? "Antal rätt svar över tid per minister" : "Andel rätt svar över tid per minister"}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverTime(null)}
        className="touch-none select-none"
      >
        {yTicks.map(v => (
          <g key={v}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#c3c2b7" : "#e1e0d9"} strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="#898781" className="tabular-nums">
              {format(v)}
            </text>
          </g>
        ))}
        {monthTicks.map(t => (
          <text key={t} x={x(t)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="#898781">
            {MONTHS[new Date(t).getMonth()]}
          </text>
        ))}

        {hoverTime !== null && (
          <line x1={x(hoverTime)} x2={x(hoverTime)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke="#c3c2b7" strokeWidth={1} />
        )}

        {lines.map(l => {
          const drawn = l.points.filter((p): p is typeof p & { v: number } => p.v !== null);
          const last = drawn.at(-1);
          return <g key={l.userId}>
            <path
              d={drawn.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("")}
              fill="none"
              stroke={l.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {last && <circle cx={x(last.t)} cy={y(last.v)} r={4} fill={l.color} stroke="white" strokeWidth={2} />}
          </g>;
        })}

        {hoverTime !== null && hovered?.rows.map(r => (
          <circle key={r.name} cx={x(hoverTime)} cy={y(r.v)} r={4} fill={r.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>}

      {hoverTime !== null && hovered && hovered.rows.length > 0 && (
        <div
          className="absolute top-2 pointer-events-none bg-white border border-gray-200 shadow-sm rounded-sm px-3 py-2 text-sm"
          style={x(hoverTime) > width / 2
            ? { right: width - x(hoverTime) + 12 }
            : { left: x(hoverTime) + 12 }}
        >
          <p className="opacity-60 whitespace-nowrap">
            Quiz #{hovered.round} · {new Date(hoverTime).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <ul>
            {hovered.rows.map(r => (
              <li key={r.name} className="flex flex-row items-center gap-x-2 whitespace-nowrap">
                <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="font-semibold tabular-nums">{format(r.v)}</span>
                <span className="opacity-70">{r.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>;
}

function valueOf(mode: Mode, point: PlayerPoint, votesSoFar: number): number | null {
  if (mode === "total") return point.cumulativeCorrect;
  if (mode === "allTime") return votesSoFar < ALL_TIME_MIN_VOTES ? null : (point.cumulativeCorrect / votesSoFar) * 100;
  return point.rollingRate === null ? null : point.rollingRate * 100;
}

function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Round a tick step up to 1, 2, 2.5 or 5 times a power of ten, so the ticks land on clean numbers. */
function niceStep(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(s => s * magnitude >= value) ?? 10;
  return Math.max(1, step * magnitude);
}

/** The first of every month between two timestamps. */
function monthStarts(tMin: number, tMax: number): number[] {
  const ticks: number[] = [];
  const date = new Date(tMin);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + 1);
  while (date.getTime() <= tMax) {
    ticks.push(date.getTime());
    date.setMonth(date.getMonth() + 1);
  }
  return ticks;
}
