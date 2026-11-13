import { prisma } from "@/lib/prisma";

/*
 * What /planlosning/ai shows: who ran the AI tracer, when, and what it cost.
 * Everything is read from PlanTrace, which keeps one row per job for good.
 */

/** Rows in the table. The totals still cover every trace. */
export const HISTORY_ROWS = 300;

const DAY = 24 * 60 * 60 * 1000;

export type Totals = {
  count: number;
  /** List price in US cents, over the traces whose cost is known */
  costCents: number;
};

export type TraceRow = {
  id: string;
  ownerName: string;
  status: "running" | "done" | "failed";
  createdAt: Date;
  finishedAt: Date | null;
  step: number;
  costCents: number | null;
  note: string;
  planId: string;
  /** The plan's name today, or null when the plan has been deleted */
  planName: string | null;
  listingUrl: string | null;
  sessionId: string | null;
};

export type MinisterTotals = Totals & {
  ownerId: string;
  name: string;
  /** Traces started in the last 24 hours, which is what the per-minister limit counts */
  lastDay: number;
};

export type TraceHistory = {
  lastDay: Totals;
  lastMonth: Totals;
  allTime: Totals;
  /** Traces that have ended, either way */
  finished: number;
  failed: number;
  /** Over finished traces with a known cost, or null when there are none */
  averageCostCents: number | null;
  /** Over finished traces, or null when there are none */
  averageSeconds: number | null;
  ministers: MinisterTotals[];
  rows: TraceRow[];
};

const status = (value: string): TraceRow["status"] => (value === "done" || value === "failed" ? value : "running");

export async function getTraceHistory(): Promise<TraceHistory> {
  /*
   * The totals are summed here from one narrow read of the whole table rather than
   * with groupBy: the average duration is a difference of two columns, which Prisma
   * can't aggregate, and the table stays small (the daily limit caps it at a few
   * thousand rows a year). One read also keeps all the figures from the same moment.
   */
  const [all, latest] = await Promise.all([
    prisma.planTrace.findMany({ select: { ownerId: true, status: true, costCents: true, createdAt: true, finishedAt: true } }),
    prisma.planTrace.findMany({
      orderBy: { createdAt: "desc" },
      take: HISTORY_ROWS,
      select: {
        id: true, ownerId: true, status: true, createdAt: true, finishedAt: true, step: true,
        costCents: true, note: true, planId: true, listingUrl: true, sessionId: true,
      },
    }),
  ]);

  // PlanTrace.planId has no FK (the plan may be deleted), so the names are looked up apart
  const [owners, plans] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: [...new Set(all.map(t => t.ownerId))] } }, select: { id: true, name: true } }),
    prisma.floorPlan.findMany({ where: { id: { in: [...new Set(latest.map(t => t.planId))] } }, select: { id: true, name: true } }),
  ]);
  const ownerName = new Map(owners.map(o => [o.id, o.name ?? "Okänd"]));
  const planName = new Map(plans.map(p => [p.id, p.name]));

  const now = Date.now();
  const lastDay: Totals = { count: 0, costCents: 0 }, lastMonth: Totals = { count: 0, costCents: 0 }, allTime: Totals = { count: 0, costCents: 0 };
  const ministers = new Map<string, MinisterTotals>();
  let finished = 0, failed = 0, priced = 0, pricedCents = 0, seconds = 0;

  for (const t of all) {
    const cents = t.costCents ?? 0, age = now - t.createdAt.getTime();
    let m = ministers.get(t.ownerId);
    if (!m) ministers.set(t.ownerId, m = { ownerId: t.ownerId, name: ownerName.get(t.ownerId) ?? "Okänd", count: 0, costCents: 0, lastDay: 0 });

    for (const totals of [allTime, m, ...(age < 30 * DAY ? [lastMonth] : []), ...(age < DAY ? [lastDay] : [])]) {
      totals.count++;
      totals.costCents += cents;
    }
    if (age < DAY) m.lastDay++;

    if (t.status === "running" || !t.finishedAt) continue;
    finished++;
    if (t.status === "failed") failed++;
    seconds += (t.finishedAt.getTime() - t.createdAt.getTime()) / 1000;
    if (t.costCents != null) {
      priced++;
      pricedCents += t.costCents;
    }
  }

  return {
    lastDay, lastMonth, allTime, finished, failed,
    averageCostCents: priced ? pricedCents / priced : null,
    averageSeconds: finished ? seconds / finished : null,
    ministers: [...ministers.values()].sort((a, b) => b.costCents - a.costCents || b.count - a.count),
    rows: latest.map(t => ({
      id: t.id,
      ownerName: ownerName.get(t.ownerId) ?? "Okänd",
      status: status(t.status),
      createdAt: t.createdAt,
      finishedAt: t.finishedAt,
      step: t.step,
      costCents: t.costCents,
      note: t.note ?? "",
      planId: t.planId,
      planName: planName.get(t.planId) ?? null,
      listingUrl: t.listingUrl,
      sessionId: t.sessionId,
    })),
  };
}
