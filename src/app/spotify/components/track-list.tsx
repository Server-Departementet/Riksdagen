"use client";

import type { TrackStats, TrackWithStats } from "@/app/spotify/types";
import TrackElement, { SkeletonTrackElement } from "@/app/spotify/components/track";
import { useEffect, useState, useMemo } from "react";
import { useFetchFilterContext } from "../context/fetch-filter-context";
import { UseLocalFilterContext } from "../context/local-filter-context";
import { sha1 } from "@/lib/hash";

// Cache helper functions
const getTrackDataCache = () => {
  if (typeof window === "undefined") return {};

  const cachedData = sessionStorage.getItem("trackDataCache");
  if (cachedData) {
    try {
      return JSON.parse(cachedData) as Record<string, TrackWithStats[]>;
    } catch (error) {
      console.error("Failed to parse track data cache:", error);
      sessionStorage.removeItem("trackDataCache");
    }
  }
  return {};
}

const getTrackStatsCache = () => {
  if (typeof window === "undefined") return {};

  const cachedStats = sessionStorage.getItem("trackStatsCache");
  if (cachedStats) {
    try {
      return JSON.parse(cachedStats) as Record<string, Record<string, TrackStats>>;
    } catch (error) {
      console.error("Failed to parse track stats cache:", error);
      sessionStorage.removeItem("trackStatsCache");
    }
  }
  return {};
}

export default function TrackList({ className = "" }: { className?: string }) {
  const { fetchFilter } = useFetchFilterContext();
  const { localFilter } = UseLocalFilterContext();
  const [trackData, setTrackData] = useState<TrackWithStats[]>([]);
  const [trackStats, setTrackStats] = useState<Record<string, TrackStats>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Memoize the current filter hash to avoid recalculating it
  const currentFilterHash = useMemo(() => sha1(JSON.stringify(fetchFilter)), [fetchFilter]);

  // Fetch track data when filter changes
  useEffect(() => {
    const fetchTrackData = async () => {
      setIsLoading(true);

      // Check for cached track data first
      const trackDataCache = getTrackDataCache();
      if (trackDataCache[currentFilterHash]) {
        setTrackData(trackDataCache[currentFilterHash]);
        setTimeout(() => setIsLoading(false), 500);
        return;
      }

      try {
        const response = await fetch("/api/spotify/track-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: fetchFilter }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch track data");
        }

        const data = await response.json() as { trackData: TrackWithStats[] };
        setTrackData(data.trackData);

        // Cache the track data
        const updatedCache = {
          ...getTrackDataCache(),
          [currentFilterHash]: data.trackData
        };
        sessionStorage.setItem("trackDataCache", JSON.stringify(updatedCache));
      } catch (error) {
        console.error("Error fetching track data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackData();
  }, [fetchFilter, currentFilterHash]);

  // Fetch track stats independently
  useEffect(() => {
    const fetchTrackStats = async () => {
      // Check for cached stats first
      const statsCache = getTrackStatsCache();
      if (statsCache[currentFilterHash]) {
        // Transform cached stats to match component state structure
        const transformedStats: Record<string, TrackStats> = {};
        const cachedFilterStats = statsCache[currentFilterHash];

        Object.keys(cachedFilterStats).forEach(key => {
          const stat = cachedFilterStats[key];
          const trackHash = sha1(stat.trackId + currentFilterHash);
          transformedStats[trackHash] = stat;
        });

        setTrackStats(transformedStats);
        return;
      }

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
        const rawStats: Record<string, TrackStats> = data.trackStats;

        // Transform stats for component state
        const transformedStats: Record<string, TrackStats> = {};
        Object.keys(rawStats).forEach(key => {
          const stat = rawStats[key];
          const trackHash = sha1(stat.trackId + currentFilterHash);
          transformedStats[trackHash] = stat;
        });

        setTrackStats(transformedStats);

        // Cache the raw stats
        const updatedStatsCache = {
          ...getTrackStatsCache(),
          [currentFilterHash]: rawStats
        };
        sessionStorage.setItem("trackStatsCache", JSON.stringify(updatedStatsCache));
      } catch (error) {
        console.error("Error fetching track stats:", error);
      }
    };

    fetchTrackStats();
  }, [currentFilterHash, fetchFilter]);

  // Apply local filtering and sorting
  const filteredTracks = useMemo(() => {
    let filtered = trackData;

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
  }, [trackData, localFilter]);

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
      </p>

      {/* Skeletons */}
      {isLoading && new Array(20).fill(0).map((_, i) =>
        <SkeletonTrackElement key={`skeleton-${i}`} />
      )}

      {/* No result */}
      {!isLoading && filteredTracks.length === 0 &&
        <div className="py-10 text-center text-gray-500">
          Inget matchar aktiva filtret.
        </div>
      }

      {/* Results */}
      {!isLoading && filteredTracks.map((track, i) =>
        <TrackElement
          trackData={track}
          statOverride={trackStats[sha1(track.id + currentFilterHash)] || null}
          lineNumber={i + 1}
          key={`track-${track.id}`}
        />
      )}
    </ul>
  );
}