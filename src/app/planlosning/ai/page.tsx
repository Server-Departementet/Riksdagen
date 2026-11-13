import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { tracerConfigured, tracerLimits } from "@/lib/planner/tracer/config";
import { HISTORY_ROWS, getTraceHistory, type TraceRow } from "@/lib/planner/tracer/history";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI-ritningar",
};

/*
 * The session in the Anthropic Console. "default" is only right when the API key
 * belongs to the default workspace; a key from another workspace needs its id here.
 */
const sessionUrl = (sessionId: string) => `https://platform.claude.com/workspaces/default/sessions/${encodeURIComponent(sessionId)}`;

const STATUS_TEXT: Record<TraceRow["status"], string> = { running: "Pågår", done: "Klar", failed: "Misslyckad" };

/** Stored as US cents; shown as dollars with two decimals. */
const usd = (cents: number | null) => (cents == null ? "–" : `$${(cents / 100).toFixed(2)}`);

const duration = (seconds: number) => {
  const s = Math.round(seconds);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
};

const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

const when = (date: Date) => date.toLocaleString("sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });

/** Only https links are made clickable, whatever ended up in the column. */
const safeLink = (value: string | null) => (value?.startsWith("https://") ? value : null);

export default async function TracerHistoryPage() {
  const session = await auth();
  if (session?.role !== "minister") return notFound();

  const history = await getTraceHistory(), limits = tracerLimits();

  return <main className="flex flex-col items-center px-4 pb-16">
    <div className="w-full max-w-5xl flex flex-col gap-y-8">
      <div>
        <h1 className="mt-4">AI-ritningar</h1>
        <p className="opacity-60 mt-1">
          Vem som har låtit AI:n rita av planlösningar och vad det kostade.{" "}
          <a href="/planlosning" className="global">Till planlösningarna</a>
        </p>
        <p className="text-sm opacity-60 mt-1">
          Kostnaderna är listpris i USD som plattformen rapporterar dem, inte fakturerat belopp.
          En ritning får kosta högst {usd(limits.maxCostCents)}.
        </p>
        {!tracerConfigured() && <p className="text-sm mt-1">AI-ritaren är inte inställd på den här servern just nu.</p>}
      </div>

      {history.allTime.count === 0
        ? <p>Ingen har ritat av något med AI ännu.</p>
        : <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Senaste dygnet" value={usd(history.lastDay.costCents)} detail={ritningar(history.lastDay.count)} />
            <StatTile label="Senaste 30 dagarna" value={usd(history.lastMonth.costCents)} detail={ritningar(history.lastMonth.count)} />
            <StatTile label="Totalt" value={usd(history.allTime.costCents)} detail={ritningar(history.allTime.count)} />
            {/* The limits count a rolling 24 hours, failed traces included, so "today" is the same window as the first tile */}
            <StatTile
              label="Dygnets kvot"
              value={`${history.lastDay.count} av ${limits.totalPerDay}`}
              detail={`högst ${limits.perMinisterPerDay} per minister`}
            />
            <StatTile label="Snittkostnad" value={usd(history.averageCostCents == null ? null : Math.round(history.averageCostCents))} detail="per avslutad ritning" />
            <StatTile label="Snittid" value={history.averageSeconds == null ? "–" : duration(history.averageSeconds)} detail="per avslutad ritning" />
            <StatTile label="Misslyckade" value={percent(history.failed, history.finished)} detail={`${history.failed} av ${history.finished} avslutade`} />
          </dl>

          <section className="flex flex-col gap-y-2">
            <h2>Per minister</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Minister</TableHead>
                  <TableHead className="text-right">Ritningar</TableHead>
                  <TableHead className="text-right">Senaste dygnet</TableHead>
                  <TableHead className="text-right">Kostnad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {history.ministers.map(m => (
                  <TableRow key={m.ownerId}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-right">{m.count}</TableCell>
                    <TableCell className="text-right">{m.lastDay} av {limits.perMinisterPerDay}</TableCell>
                    <TableCell className="text-right font-semibold">{usd(m.costCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="flex flex-col gap-y-2">
            <h2>Ritningar</h2>
            {history.allTime.count > history.rows.length
              && <p className="text-sm opacity-60">De {HISTORY_ROWS} senaste av {history.allTime.count}. Summorna ovan gäller alla.</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>När</TableHead>
                  <TableHead>Minister</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tid</TableHead>
                  <TableHead className="text-right">Steg</TableHead>
                  <TableHead className="text-right">Kostnad</TableHead>
                  <TableHead>Planlösning</TableHead>
                  <TableHead>Länkar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {history.rows.map(t => <TraceRows key={t.id} trace={t} />)}
              </TableBody>
            </Table>
          </section>
        </>}
    </div>
  </main>;
}

const ritningar = (count: number) => `${count} ${count === 1 ? "ritning" : "ritningar"}`;

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="border-2 rounded-md px-3 py-2">
    <dt className="text-sm opacity-60">{label}</dt>
    <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    <dd className="text-sm opacity-60">{detail}</dd>
  </div>;
}

/** One trace: its figures, and under them the note in a row of its own so a long report can't widen a column. */
function TraceRows({ trace: t }: { trace: TraceRow }) {
  const listing = safeLink(t.listingUrl);
  return <>
    <TableRow className={t.note ? "border-b-0" : undefined}>
      <TableCell className="whitespace-nowrap">{when(t.createdAt)}</TableCell>
      <TableCell>{t.ownerName}</TableCell>
      <TableCell className={t.status === "failed" ? "text-red-700" : undefined}>{STATUS_TEXT[t.status]}</TableCell>
      <TableCell className="text-right whitespace-nowrap">
        {t.finishedAt ? duration((t.finishedAt.getTime() - t.createdAt.getTime()) / 1000) : t.status === "running" ? "pågår" : "–"}
      </TableCell>
      <TableCell className="text-right">{t.step}</TableCell>
      <TableCell className="text-right">{usd(t.costCents)}</TableCell>
      <TableCell>
        {t.planName == null
          ? <span className="opacity-60">Borttagen</span>
          : <a href={`/planlosning?plan=${encodeURIComponent(t.planId)}`} className="global">{t.planName}</a>}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="flex flex-row gap-x-3">
          {listing && <a href={listing} className="global" target="_blank" rel="noreferrer">Annons</a>}
          {t.sessionId && <a href={sessionUrl(t.sessionId)} className="global" target="_blank" rel="noreferrer">Session</a>}
        </span>
      </TableCell>
    </TableRow>
    {t.note && <TableRow>
      <TableCell colSpan={8} className="pt-0 whitespace-normal">
        <details>
          <summary className="cursor-pointer text-sm opacity-60">
            {t.status === "done" ? "Rapport" : t.status === "failed" ? "Felmeddelande" : "Senaste meddelande"}
          </summary>
          <p className="mt-1 max-w-3xl whitespace-pre-wrap wrap-break-word font-normal">{t.note}</p>
        </details>
      </TableCell>
    </TableRow>}
  </>;
}
