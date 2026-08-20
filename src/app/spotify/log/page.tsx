import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/prisma";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  "ok": "ok",
  "import": "import",
  "token-failed": "ogiltig token",
  "fetch-failed": "Spotify-fel",
  "write-failed": "databasfel",
};

const okStatuses = ["ok", "import"];

export default async function SpotifyLogPage() {
  const session = await auth();
  if (session?.role !== "minister") return notFound();

  const rows = await prisma.trackPlayFetch.findMany({
    orderBy: [{ runAt: "desc" }, { id: "asc" }],
    take: 200,
    include: { user: { select: { name: true } } },
  });

  // Rows of the same script run share a runAt; group them for display
  const runs: { runAt: Date; rows: typeof rows }[] = [];
  for (const row of rows) {
    const currentRun = runs.at(-1);
    if (currentRun && currentRun.runAt.getTime() === row.runAt.getTime()) {
      currentRun.rows.push(row);
    }
    else {
      runs.push({ runAt: row.runAt, rows: [row] });
    }
  }

  return <main className="flex flex-col items-center px-4 pb-16">
    <div className="w-full max-w-2xl">
      <h1 className="mt-4">Hämtningslogg</h1>

      <p className="opacity-60 mt-1">
        Spotify-spelningar hämtas var 15:e minut. Här syns de senaste körningarna
        och vad de gav. Står det &quot;ogiltig token&quot; behöver du koppla om
        ditt konto på <a href="/spotify" className="global">Spotify-sidan</a>.
      </p>

      {runs.length === 0 && (
        <p className="mt-4">Inga körningar loggade ännu.</p>
      )}

      <ul className="mt-4 flex flex-col gap-y-3">
        {runs.map(run => (
          <li key={run.runAt.toISOString()} className="border-2 rounded-md px-3 py-2">
            <p className="tabular-nums font-bold">
              {run.runAt.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}
            </p>

            <ul className="mt-1">
              {run.rows.map(row => (
                <li
                  key={row.id}
                  className="not-first:border-t py-1 flex flex-row flex-wrap gap-x-3 items-baseline"
                >
                  <span className="w-32 shrink-0 truncate" title={row.user.name ?? row.userId}>
                    {row.user.name ?? row.userId}
                  </span>
                  <span className={`w-28 shrink-0 ${okStatuses.includes(row.status) ? "" : "text-red-600 font-bold"}`}>
                    {statusLabels[row.status] ?? row.status}
                  </span>
                  {okStatuses.includes(row.status) && (
                    <span className="tabular-nums">
                      {row.inserted} nya
                      {row.skipped > 0 ? `, ${row.skipped} redan sparade` : ""}
                    </span>
                  )}
                  {row.detail && (
                    <span className="opacity-60 min-w-0 truncate" title={row.detail}>
                      {row.detail}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  </main>;
}
