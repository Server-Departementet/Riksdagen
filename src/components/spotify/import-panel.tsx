"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { ImportResponse } from "@/app/api/spotify/import/route";

/**
 * Historic takeout import. Parses "Streaming_History_Audio_*.json" files from
 * a Spotify data export locally, keeps audio track plays of at least 30
 * seconds (Spotify's own threshold for a counted stream), and uploads them in
 * chunks to /api/spotify/import.
 */

const TRACK_URI_PREFIX = "spotify:track:";
const MIN_PLAY_MS = 30_000;
const CHUNK_SIZE = 500;

type TakeoutEntry = {
  ts?: string;
  ms_played?: number;
  spotify_track_uri?: string | null;
};

type Status =
  | { state: "idle" }
  | { state: "working"; sent: number; total: number; pendingTracks?: number }
  | { state: "done"; result: Totals; skippedEntries: number }
  | { state: "error"; message: string };

type Totals = Pick<ImportResponse, "inserted" | "duplicates" | "unresolved" | "newTracks">;

export function ImportPanel() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const working = status.state === "working";
  const formatNumber = (n: number) => n.toLocaleString("sv-SE");

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

      const totals: Totals = { inserted: 0, duplicates: 0, unresolved: 0, newTracks: 0 };
      for (let i = 0; i < plays.length; i += CHUNK_SIZE) {
        const chunk = plays.slice(i, i + CHUNK_SIZE);

        // The server resolves a bounded number of unknown tracks per request
        // and reports pending > 0 until the chunk is fully processed
        let pending = Infinity;
        let attempts = 0;
        while (pending > 0) {
          if (++attempts > 500) {
            setStatus({ state: "error", message: "Importen kom inte vidare. Det är säkert att försöka igen." });
            return;
          }

          const response = await fetch("/api/spotify/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plays: chunk }),
          });
          if (!response.ok) {
            const body = await response.json().catch(() => null) as { error?: string } | null;
            setStatus({
              state: "error",
              message: `Importen avbröts efter ${formatNumber(i)} av ${formatNumber(plays.length)} spelningar: ${body?.error ?? `HTTP ${response.status}`}. Det är säkert att försöka igen.`,
            });
            return;
          }

          const result = await response.json() as ImportResponse;
          pending = result.pending;
          totals.newTracks += result.newTracks;
          if (pending > 0) {
            setStatus({ state: "working", sent: i, total: plays.length, pendingTracks: pending });
            continue;
          }

          totals.inserted += result.inserted;
          totals.duplicates += result.duplicates;
          totals.unresolved += result.unresolved;
        }

        setStatus({ state: "working", sent: Math.min(i + CHUNK_SIZE, plays.length), total: plays.length });
      }

      setStatus({ state: "done", result: totals, skippedEntries: totalEntries - plays.length });
    }
    catch (err) {
      console.error("Takeout import failed:", err);
      setStatus({ state: "error", message: "Något gick fel under importen. Det är säkert att försöka igen." });
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
          importeras — poddar och videor hoppas över. Dubbletter läggs inte in,
          så det är säkert att köra om.
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
          {working ? "Importerar…" : "Importera"}
        </Button>

        {status.state === "working" && (
          <p className="text-sm" aria-live="polite">
            Skickar {formatNumber(status.sent)} av {formatNumber(status.total)} spelningar…
            {status.pendingTracks !== undefined && (
              <> Hämtar låtinfo ({formatNumber(status.pendingTracks)} låtar kvar i denna del)…</>
            )}
          </p>
        )}

        {status.state === "done" && (
          <p className="text-sm" aria-live="polite">
            Klart! {formatNumber(status.result.inserted)} spelningar importerades
            ({formatNumber(status.result.newTracks)} nya låtar).
            {status.result.duplicates > 0 && ` ${formatNumber(status.result.duplicates)} fanns redan.`}
            {status.result.unresolved > 0 && ` ${formatNumber(status.result.unresolved)} kunde inte matchas mot Spotify.`}
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
