"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import type { ImportResponse, QueueStatus } from "@/app/api/spotify/import/route";

/**
 * Historic takeout import. Parses "Streaming_History_Audio_*.json" files from
 * a Spotify data export locally, keeps audio track plays of at least 30
 * seconds (Spotify's own threshold for a counted stream), and enqueues them on
 * the server. The server drains the queue slowly on its own; progress shows up
 * on /spotify/log and in the queue counter here.
 */

const TRACK_URI_PREFIX = "spotify:track:";
const MIN_PLAY_MS = 30_000;
const CHUNK_SIZE = 1000;

type TakeoutEntry = {
  ts?: string;
  ms_played?: number;
  spotify_track_uri?: string | null;
};

type Status =
  | { state: "idle" }
  | { state: "working"; sent: number; total: number }
  | { state: "done"; result: Totals; skippedEntries: number }
  | { state: "error"; message: string };

type Totals = Pick<ImportResponse, "queued" | "alreadyQueued" | "alreadyImported">;

export function ImportPanel() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [queue, setQueue] = useState<QueueStatus | null>(null);

  const working = status.state === "working";
  const formatNumber = (n: number) => n.toLocaleString("sv-SE");

  async function refreshQueue() {
    const response = await fetch("/api/spotify/import").catch(() => null);
    if (!response?.ok) return;
    setQueue(await response.json() as QueueStatus);
  }

  useEffect(() => {
    // Fetch-on-mount: the queue counter comes from the server, not props
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshQueue();
  }, []);

  async function startImport() {
    if (!files || files.length === 0) return;

    try {
      let totalEntries = 0;
      const playsByKey = new Map<string, { trackId: string; playedAt: string }>();
      for (const file of Array.from(files)) {
        const entries = JSON.parse(await file.text()) as unknown;
        if (!Array.isArray(entries)) {
          setStatus({ state: "error", message: `${file.name} är inte en giltig historikfil.` });
          return;
        }

        totalEntries += entries.length;
        for (const entry of entries as TakeoutEntry[]) {
          if (!entry.spotify_track_uri?.startsWith(TRACK_URI_PREFIX)) continue;
          if ((entry.ms_played ?? 0) < MIN_PLAY_MS) continue;
          if (!entry.ts || isNaN(new Date(entry.ts).getTime())) continue;

          const trackId = entry.spotify_track_uri.slice(TRACK_URI_PREFIX.length);
          playsByKey.set(`${trackId}@${entry.ts}`, { trackId, playedAt: entry.ts });
        }
      }

      const plays = [...playsByKey.values()];
      if (plays.length === 0) {
        setStatus({ state: "error", message: "Inga importerbara spelningar hittades i filerna." });
        return;
      }

      setStatus({ state: "working", sent: 0, total: plays.length });

      const totals: Totals = { queued: 0, alreadyQueued: 0, alreadyImported: 0 };
      for (let i = 0; i < plays.length; i += CHUNK_SIZE) {
        const chunk = plays.slice(i, i + CHUNK_SIZE);

        const response = await fetch("/api/spotify/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plays: chunk }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string } | null;
          setStatus({
            state: "error",
            message: `Uppladdningen avbröts efter ${formatNumber(i)} av ${formatNumber(plays.length)} spelningar: ${body?.error ?? `HTTP ${response.status}`}. Det är säkert att försöka igen.`,
          });
          return;
        }

        const result = await response.json() as ImportResponse;
        totals.queued += result.queued;
        totals.alreadyQueued += result.alreadyQueued;
        totals.alreadyImported += result.alreadyImported;

        setStatus({ state: "working", sent: Math.min(i + CHUNK_SIZE, plays.length), total: plays.length });
      }

      setStatus({ state: "done", result: totals, skippedEntries: totalEntries - plays.length });
      void refreshQueue();
    }
    catch (err) {
      console.error("Takeout upload failed:", err);
      setStatus({ state: "error", message: "Något gick fel under uppladdningen. Det är säkert att försöka igen." });
    }
  }

  return (
    <details className="w-fit max-w-xs">
      <summary className="cursor-pointer font-bold">
        Importera historik
      </summary>

      <div className="flex flex-col gap-y-3 mt-2">
        <p className="text-sm">
          Ladda upp <code>Streaming_History_Audio_*.json</code> från
          din Spotify-dataexport. Endast låtar spelade i minst 30 sekunder
          importeras — poddar och videor hoppas över. Uppladdningen köar bara
          spelningarna; servern betar av kön i lugn takt och förloppet syns
          på <a href="/spotify/log" className="global">Hämtningsloggen</a>.
          Samma fil igen köas inte om.
        </p>

        <Input
          type="file"
          multiple
          accept=".json,application/json"
          disabled={working}
          onChange={(e) => setFiles(e.target.files)}
        />

        <Button
          type="button"
          variant="outline"
          className="hover:bg-gray-800 hover:text-white"
          disabled={working || !files || files.length === 0}
          onClick={() => void startImport()}
        >
          {working ? "Laddar upp…" : "Importera"}
        </Button>

        {queue && queue.pending > 0 && (
          <p className="text-sm opacity-60" aria-live="polite">
            {formatNumber(queue.pending)} spelningar väntar i kön.
          </p>
        )}

        {status.state === "working" && (
          <p className="text-sm" aria-live="polite">
            Laddar upp {formatNumber(status.sent)} av {formatNumber(status.total)} spelningar…
          </p>
        )}

        {status.state === "done" && (
          <p className="text-sm" aria-live="polite">
            {status.result.queued > 0
              ? `Klart! ${formatNumber(status.result.queued)} spelningar köades.`
              : "Allt i filerna är redan importerat eller köat sedan tidigare."}
            {status.result.alreadyQueued > 0 && ` ${formatNumber(status.result.alreadyQueued)} låg redan i kön.`}
            {status.result.alreadyImported > 0 && ` ${formatNumber(status.result.alreadyImported)} var redan importerade.`}
            {status.skippedEntries > 0 && ` ${formatNumber(status.skippedEntries)} poster i filerna var inte importerbara låtspelningar.`}
          </p>
        )}

        {status.state === "error" && (
          <p className="text-sm text-red-600" aria-live="polite">
            {status.message}
          </p>
        )}
      </div>
    </details>
  );
}
