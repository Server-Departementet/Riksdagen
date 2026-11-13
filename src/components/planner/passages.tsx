import type { PlanData } from "@/lib/planner/plan";
import type { Stacking } from "@/lib/planner/geometry";
import { narrowPassages } from "@/lib/planner/geometry";

// Amber: a warning, but neither the red of an overlap nor the green of the measured distances.
const BAND = "#f59e0b", EDGE = "#b45309", TEXT = "#7c2d12", HALO = "#fffdf8";

/**
 * Bands over the floor where furniture leaves too little room to walk, each with its width in cm.
 * The tight ones are filled stronger than the merely cramped ones. `px` is one screen pixel in cm:
 * lines and text keep their size on screen at any zoom.
 */
export function PassageBands({ plan, stack, px }: { plan: PlanData; stack: Stacking; px: number }) {
  const bands = narrowPassages(plan, stack);
  return <g>
    {bands.map((b, i) => {
      // The two sides the width is measured between are drawn as lines; the open ends are left open.
      const sides = b.across === "x" ? `M${b.x} ${b.y}v${b.h}M${b.x + b.w} ${b.y}v${b.h}` : `M${b.x} ${b.y}h${b.w}M${b.x} ${b.y + b.h}h${b.w}`;
      return <g key={i}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={BAND} fillOpacity={b.tight ? 0.5 : 0.2} />
        <path d={sides} fill="none" stroke={EDGE} strokeOpacity={b.tight ? 1 : 0.6} strokeWidth={(b.tight ? 1.5 : 1) * px}
          strokeDasharray={b.tight ? undefined : `${4 * px} ${3 * px}`} />
      </g>;
    })}
    {/* The figures go on top of all bands, so that no band covers a neighbour's figure. */}
    {bands.map((b, i) => (
      <text key={i} x={b.x + b.w / 2} y={b.y + b.h / 2 + (b.tight ? 4.5 : 4) * px} textAnchor="middle" fontSize={(b.tight ? 13 : 11) * px}
        fill={TEXT} stroke={HALO} strokeWidth={3 * px} paintOrder="stroke" style={{ fontWeight: b.tight ? 700 : 600 }}>{b.width}</text>
    ))}
  </g>;
}
