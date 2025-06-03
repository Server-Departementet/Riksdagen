"use client";

import type { TrackStats, TrackWithStats } from "@/app/spotify/types";
import TrackElement from "@/app/spotify/components/track";
import { useEffect, useState } from "react";
import { useFetchFilterContext } from "../context/fetch-filter-context";
import { sha1 } from "@/lib/hash";

export default function TrackList({ className = "" }: { className?: string }) {
  const { fetchFilter } = useFetchFilterContext();
  const [trackData, setTrackData] = useState<TrackWithStats[]>([]);
  const [trackStats, setTrackStats] = useState<Record<string, TrackStats>>({});
  const [lastFilterHash, setLastFilterHash] = useState<string>(sha1(JSON.stringify(fetchFilter)));

  // Keep filter hash in sync with fetchFilter
  useEffect(() => {
    const currentFilterHash = sha1(JSON.stringify(fetchFilter));
    if (currentFilterHash !== lastFilterHash) {
      setLastFilterHash(currentFilterHash);
    }
  }, [fetchFilter, lastFilterHash]);

  // Fetch track data from /api/spotify/track-data with filter in body
  useEffect(() => {
    const fetchTrackData = async () => {
      try {
        const response = await fetch("/api/spotify/track-data", {
          method: "POST",
          headers: { "Content-Type": "application/json", },
          body: JSON.stringify({ filter: fetchFilter }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch track data");
        }

        const data = await response.json() as { trackData: TrackWithStats[] };
        setTrackData(data.trackData);
      } catch (error) {
        console.error("Error fetching track data:", error);
      }
    };

    if (!trackData.length) fetchTrackData();
  }, [fetchFilter, trackData.length]);

  // On filter change, refetch track stats from /api/spotify/track-stats with filter in body
  useEffect(() => {
    const fetchTrackStats = async () => {
      try {
        const response = await fetch("/api/spotify/track-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: fetchFilter }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch track stats");
        }
        const data = await response.json();
        const stats: Record<string, TrackStats> = data.trackStats;
        setTrackStats(stats);
      } catch (error) {
        console.error("Error fetching track stats:", error);
      }
    };

    // Refetch track stats if:
    // 1. No track stats are present
    // 2. The filter hash has changed
    if (!Object.keys(trackStats).length || lastFilterHash !== sha1(JSON.stringify(fetchFilter))) {
      fetchTrackStats();
    }
  }, [fetchFilter, lastFilterHash, trackStats]);

  return (
    <ul className={`
      overflow-y-auto 
      flex flex-col
      gap-y-3
      px-6 sm:ps-0
      *:first:mt-5 *:last:mb-10
      ${className}
    `}>
      {trackData.map((track, i) => (
        <TrackElement
          trackData={track}
          statOverride={trackStats[sha1(track.id + sha1(JSON.stringify(fetchFilter)))] || null}
          lineNumber={i + 1}
          key={`track-${track.id}`}
        />
      ))}
    </ul>
  );
}