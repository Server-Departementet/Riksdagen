"use client";

import type { Track, TrackId, TrackStats } from "@/app/spotify/types";
import TrackElement, { SkeletonTrackElement } from "@/app/spotify/components/track";
import { useEffect, useState, useMemo } from "react";
import { useFetchFilterContext } from "../context/fetch-filter-context";
import { useLocalFilterContext } from "../context/local-filter-context";
import { sha1 } from "@/lib/hash";
import { decodeTrackData, decodeTrackIndex, decodeTrackStats } from "@/lib/spotify.proto";

export default function TrackList({ className = "" }: { className?: string }) {
  const { fetchFilter } = useFetchFilterContext();
  const { localFilter } = useLocalFilterContext();
  const [trackIndex, setTrackIndex] = useState<TrackId[]>([]);
  const [trackData, setTrackData] = useState<Record<TrackId, Track>>({});
  const [trackStats, setTrackStats] = useState<Record<TrackId, TrackStats>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Memoize the current filter hash to avoid recalculating it
  const currentFilterHash = useMemo(() => sha1(JSON.stringify(fetchFilter)), [fetchFilter]);

  useEffect(() => {
    setIsLoading(true);

    const fetchTrackIndex = async () => {
      const response = await fetch("/api/spotify/tracks?type=index",
        {
          method: "POST",
          body: JSON.stringify({ filter: fetchFilter }),
        }
      );

      if (!response.ok) {
        console.error("Error on fetching tracks index");
        return;
      }
      const { index } = await response.json() as { index: Uint8Array };
      const decodedIndex = decodeTrackIndex(index);

      setTrackIndex(decodedIndex.trackIds);
    };

    const fetchTrackData = async () => {
      const response = await fetch("/api/spotify/tracks?type=data",
        {
          method: "POST",
          body: JSON.stringify({ filter: fetchFilter }),
        }
      );

      if (!response.ok) {
        console.error("Error on fetching tracks data");
        return;
      }

      const { trackData } = await response.json() as { trackData: Uint8Array };
      const decodedTrackData = decodeTrackData(trackData);

      setTrackData(Object.fromEntries(decodedTrackData.trackData.map(t => [t.id, t])));
    }

    const fetchTrackStats = async () => {
      const response = await fetch("/api/spotify/tracks?type=stats",
        {
          method: "POST",
          body: JSON.stringify({ filter: fetchFilter }),
        }
      );

      if (!response.ok) {
        console.error("Error on fetching tracks stats");
        return;
      }

      const { trackStats } = await response.json() as { trackStats: Uint8Array };
      const decodedTrackStats = decodeTrackStats(trackStats);
      setTrackStats(Object.fromEntries(decodedTrackStats.trackStats.map(t => [t.trackId, t])));
    }

    fetchTrackIndex();
    fetchTrackData().then(() => setIsLoading(false));
    fetchTrackStats();
  }, [fetchFilter]);

  // Apply local filtering and sorting
  const filteredTracks = useMemo(() => {
    let filtered = Object.values(trackData).map(t => ({ ...t, ...trackStats[t.id] }));

    // Apply search filter
    if (localFilter.search) {
      const searchLower = localFilter.search.toLowerCase();
      filtered = filtered.filter(track =>
        track.name.toLowerCase().includes(searchLower) ||
        track.artists.some(artist => artist.name.toLowerCase().includes(searchLower)) ||
        track.album.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (localFilter.sort) {
      filtered = [...filtered].sort(localFilter.sort.func);

      if (localFilter.reverseOrder) {
        filtered = filtered.reverse();
      }
    }

    return filtered;
  }, [trackData, localFilter, trackStats]);

  return (
    <ul className={`
      overflow-y-auto 
      flex flex-col
      gap-y-3
      px-6 sm:ps-0
      *:first:mt-3 *:last:mb-10
      ${className}
    `}>
      {/* Stats */}
      <p className="text-sm opacity-60 font-normal w-full text-center sm:text-start">
        {filteredTracks.length} resultat
        {/* &nbsp;&middot;&nbsp; */}
      </p>

      {/* Skeletons */}
      {isLoading && new Array(20).fill(0).map((_, i) =>
        <SkeletonTrackElement key={`skeleton-${i}`} />
      )}

      {/* No result */}
      {!isLoading && (trackIndex.length === 0 || filteredTracks.length === 0) &&
        <div className="py-10 text-center text-gray-500">
          Inget matchar aktiva filtret.
        </div>
      }

      {/* Results */}
      {!isLoading && filteredTracks.map((track, i) =>
        <TrackElement
          trackData={track}
          trackStats={trackStats[track.id]}
          lineNumber={i + 1}
          key={`track-${track.id}`}
        />
      )}
    </ul>
  );
}