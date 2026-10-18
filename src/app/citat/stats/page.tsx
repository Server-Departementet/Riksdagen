import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuizStats, MIN_VOTES_FOR_CHART, ROLLING_WINDOW } from "@/lib/quiz-stats";
import { ProgressChart } from "@/components/quiz/progress-chart";
import { SERIES_COLORS } from "@/lib/chart-colors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quizstatistik",
};

const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

export default async function QuizStatsPage() {
  const session = await auth();
  if (session?.role !== "minister") return notFound();

  const stats = await getQuizStats();
  const colorOf = new Map(stats.series.map((s, i) => [s.userId, SERIES_COLORS[i % SERIES_COLORS.length]]));

  return <main className="flex flex-col items-center px-4 pb-16">
    <div className="w-full max-w-4xl flex flex-col gap-y-8">
      <div>
        <h1 className="mt-4">Quizstatistik</h1>
        <p className="opacity-60 mt-1">
          Resultaten från det dagliga citatquizet i Discord.{" "}
          <a href="/citat" className="global">Alla citat</a>
        </p>
      </div>

      {stats.rounds === 0
        ? <p>Inga avslutade quizrundor ännu.</p>
        : <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Avslutade rundor" value={String(stats.rounds)} />
            <StatTile label="Röster" value={String(stats.votes)} />
            <StatTile label="Andel rätt" value={percent(stats.correct, stats.votes)} />
            <StatTile
              label="Sedan"
              value={stats.firstRoundAt
                ? new Date(stats.firstRoundAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Stockholm" })
                : "–"}
            />
          </dl>

          <section className="flex flex-col gap-y-2">
            <h2>Över tid</h2>
            <ProgressChart series={stats.series} rollingWindow={ROLLING_WINDOW} />
            <p className="text-sm opacity-60">
              Träffsäkerheten räknas över de senaste {ROLLING_WINDOW} rundorna personen röstade i.
              Den som röstat färre än {MIN_VOTES_FOR_CHART} gånger syns bara i tabellen.
            </p>
          </section>

          <section className="flex flex-col gap-y-2">
            <h2>Topplista</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Minister</TableHead>
                  <TableHead className="text-right">Rätt</TableHead>
                  <TableHead className="text-right">Röster</TableHead>
                  <TableHead className="text-right">Träffsäkerhet</TableHead>
                  <TableHead className="text-right">Längsta svit</TableHead>
                  <TableHead className="text-right">Nuvarande svit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {stats.players.map(p => (
                  <TableRow key={p.userId}>
                    <TableCell>
                      <span className="flex flex-row items-center gap-x-2">
                        <span
                          className="inline-block w-4 h-0.5 rounded-full"
                          style={{ backgroundColor: colorOf.get(p.userId) ?? "transparent" }}
                        />
                        {p.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{p.correct}</TableCell>
                    <TableCell className="text-right">{p.votes}</TableCell>
                    <TableCell className="text-right">{percent(p.correct, p.votes)}</TableCell>
                    <TableCell className="text-right">{p.longestStreak}</TableCell>
                    <TableCell className="text-right">{p.currentStreak}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="flex flex-col gap-y-2">
            <h2>Vems citat är svårast?</h2>
            <p className="text-sm opacity-60">Andel rätt svar när citatet var av personen. Svårast överst.</p>
            <ul className="flex flex-col gap-y-1.5">
              {stats.quotees.map(q => {
                const share = q.votes ? q.correct / q.votes : 0;
                return <li
                  key={q.name}
                  className="grid grid-cols-[9rem_1fr] sm:grid-cols-[11rem_1fr] items-center gap-x-3 text-sm"
                  title={`${q.correct} av ${q.votes} röster rätt, ${q.rounds} rundor`}
                >
                  <span className="truncate">{q.name}</span>
                  <span className="flex flex-row items-center gap-x-2">
                    <span
                      className="h-4 rounded-r-sm"
                      style={{ width: `calc(${share} * (100% - 7rem))`, backgroundColor: SERIES_COLORS[0] }}
                    />
                    <span className="tabular-nums whitespace-nowrap">
                      {percent(q.correct, q.votes)}
                      <span className="opacity-60"> · {q.rounds} rundor</span>
                    </span>
                  </span>
                </li>;
              })}
            </ul>
          </section>
        </>}
    </div>
  </main>;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return <div className="border-2 rounded-md px-3 py-2">
    <dt className="text-sm opacity-60">{label}</dt>
    <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
  </div>;
}
