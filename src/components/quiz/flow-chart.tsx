"use client";

import { useRef, useState } from "react";
import type { FlowMonth } from "@/lib/quiz-stats";
import { niceStep, useWidth } from "./progress-chart";

const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 40 };
const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
// Up is quotes coming in, down is quotes the quiz used up: position carries the sign,
// so the green/red pair never has to on its own
const ADDED_COLOR = "#1baf7a";
const QUIZZED_COLOR = "#e34948";
const NET_COLOR = "#0b0b0b";

const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");
const monthLabel = (month: string, long = false) => {
  const [year, m] = month.split("-").map(Number);
  const name = MONTHS[(m ?? 1) - 1] ?? month;
  return long ? `${name} ${year}` : name;
};

export function FlowChart({ months }: { months: FlowMonth[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useWidth(containerRef);

  const maxUp = Math.max(1, ...months.map(m => m.added));
  const maxDown = Math.max(1, ...months.map(m => m.quizzed));
  const step = niceStep(Math.max(maxUp, maxDown) / 3);
  const yMax = step * Math.ceil(maxUp / step);
  const yMin = -step * Math.ceil(maxDown / step);

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = months.length ? innerW / months.length : 0;
  const barW = Math.max(4, Math.min(40, slot * 0.6));
  const cx = (i: number) => MARGIN.left + slot * (i + 0.5);
  const y = (v: number) => MARGIN.top + ((yMax - v) / (yMax - yMin)) * innerH;
  const ticks = Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step);

  const active = hovered === null ? null : months[hovered];

  return <div className="flex flex-col gap-y-3">
    <ul className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm">
      <li className="flex flex-row items-center gap-x-1.5">
        <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: ADDED_COLOR }} />
        Nya citat
      </li>
      <li className="flex flex-row items-center gap-x-1.5">
        <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: QUIZZED_COLOR }} />
        Quizzade
      </li>
      <li className="flex flex-row items-center gap-x-1.5">
        <span className="inline-block w-4 h-0.5 rounded-full" style={{ backgroundColor: NET_COLOR }} />
        Netto
      </li>
    </ul>

    <div ref={containerRef} className="relative w-full">
      {width > 0 && <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Nya citat och quizzade citat per månad"
        onPointerLeave={() => setHovered(null)}
        className="touch-none select-none"
      >
        {ticks.map(v => (
          <g key={v}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#c3c2b7" : "#e1e0d9"} strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="#898781" className="tabular-nums">
              {signed(v)}
            </text>
          </g>
        ))}

        {months.map((m, i) => {
          const net = m.added - m.quizzed;
          const x0 = cx(i) - barW / 2;
          const dim = hovered !== null && hovered !== i ? 0.45 : m.partial ? 0.6 : 1;
          return <g key={m.month} opacity={dim}>
            {m.added > 0 && <path d={roundedBar(x0, y(0) - 1, barW, y(0) - 1 - y(m.added), "up")} fill={ADDED_COLOR} />}
            {m.quizzed > 0 && <path d={roundedBar(x0, y(0) + 1, barW, y(-m.quizzed) - y(0) - 1, "down")} fill={QUIZZED_COLOR} />}
            <line x1={x0 - 3} x2={x0 + barW + 3} y1={y(net)} y2={y(net)} stroke={NET_COLOR} strokeWidth={2} strokeLinecap="round" />
            <text x={cx(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="#898781">
              {monthLabel(m.month)}
            </text>
          </g>;
        })}

        {/* Hit targets: the whole column, not just the bars */}
        {months.map((m, i) => (
          <rect
            key={m.month}
            x={MARGIN.left + slot * i}
            y={MARGIN.top}
            width={slot}
            height={innerH}
            fill="transparent"
            onPointerEnter={() => setHovered(i)}
          />
        ))}
      </svg>}

      {active && hovered !== null && (
        <div
          className="absolute top-2 pointer-events-none bg-white border border-gray-200 shadow-sm rounded-sm px-3 py-2 text-sm"
          style={cx(hovered) > width / 2 ? { right: width - cx(hovered) + barW / 2 + 8 } : { left: cx(hovered) + barW / 2 + 8 }}
        >
          <p className="opacity-60 whitespace-nowrap">{monthLabel(active.month, true)}{active.partial ? " (hittills)" : ""}</p>
          <dl className="grid grid-cols-[auto_auto] gap-x-3 tabular-nums whitespace-nowrap">
            <dt>Nya citat</dt><dd className="text-right">{signed(active.added)}</dd>
            <dt>Quizzade</dt><dd className="text-right">{signed(-active.quizzed)}</dd>
            <dt className="font-semibold">Netto</dt><dd className="text-right font-semibold">{signed(active.added - active.quizzed)}</dd>
            <dt className="opacity-60">Kvar efteråt</dt><dd className="text-right opacity-60">{active.left}</dd>
          </dl>
        </div>
      )}
    </div>
  </div>;
}

/** A bar anchored on the baseline with 4px rounded corners on its far end only. */
function roundedBar(x: number, base: number, w: number, h: number, direction: "up" | "down"): string {
  const r = Math.min(4, w / 2, Math.max(0, h));
  if (h <= 0) return "";
  if (direction === "up") {
    const top = base - h;
    return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`;
  }
  const bottom = base + h;
  return `M${x},${base}V${bottom - r}Q${x},${bottom} ${x + r},${bottom}H${x + w - r}Q${x + w},${bottom} ${x + w},${bottom - r}V${base}Z`;
}
