"use client";

import type { Track, TrackStats, TrackWithStats } from "@/app/spotify/types";
import TrackElement, { SkeletonTrackElement } from "@/app/spotify/components/track";
import { useEffect, useState, useMemo } from "react";
import { useFetchFilterContext } from "../context/fetch-filter-context";
import { UseLocalFilterContext } from "../context/local-filter-context";
import { sha1 } from "@/lib/hash";

// Create session storage for track data and stats cache
if (typeof window !== "undefined") {
  const trackDataCache = sessionStorage.getItem("trackDataCache");
  if (trackDataCache) {
    try {
      const parsedData = JSON.parse(trackDataCache) as Record<string, Track[]>; // Don't cache stats here, only track data
      if (Array.isArray(parsedData)) {
        sessionStorage.setItem("trackDataCache", JSON.stringify(parsedData));
      }
    } catch (error) {
      console.error("Failed to parse track data cache:", error);
      sessionStorage.removeItem("trackDataCache");
    }
  }
  const trackStatsCache = sessionStorage.getItem("trackStatsCache");
  if (trackStatsCache) {
    try {
      const parsedStats = JSON.parse(trackStatsCache) as Record<string, TrackStats>;
      if (typeof parsedStats === "object") {
        sessionStorage.setItem("trackStatsCache", JSON.stringify(parsedStats));
      }
    } catch (error) {
      console.error("Failed to parse track stats cache:", error);
      sessionStorage.removeItem("trackStatsCache");
    }
  }
}

const getTrackDataCache = () => {
  const cachedData = sessionStorage.getItem("trackDataCache");
  if (cachedData) {
    try {
      return JSON.parse(cachedData) as Record<string, Track[]>;
    } catch (error) {
      console.error("Failed to parse track data cache:", error);
      sessionStorage.removeItem("trackDataCache");
    }
  }
  return {};
}

const getTrackStatsCache = () => {
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
  const [lastFilterHash, setLastFilterHash] = useState<string>(sha1(JSON.stringify(fetchFilter)));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Keep filter hash in sync with fetchFilter
  useEffect(() => {
    const currentFilterHash = sha1(JSON.stringify(fetchFilter));
    if (currentFilterHash !== lastFilterHash) {
      setLastFilterHash(currentFilterHash);
      setIsLoading(true); // Set loading when filter changes
    }
  }, [fetchFilter, lastFilterHash]);

  // Fetch track data from /api/spotify/track-data with filter in body
  useEffect(() => {
    const currentFilterHash = sha1(JSON.stringify(fetchFilter));

    const fetchTrackData = async () => {
      setIsLoading(true);

      // Check if we have cached track data
      const trackDataCache = getTrackDataCache();
      if (trackDataCache[currentFilterHash]) {
        setTrackData(trackDataCache[currentFilterHash] as TrackWithStats[]);
        setTimeout(() => setIsLoading(false), 500);
        return;
      }

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

        // Set cached track data in session storage with filter hash
        const trackDataCache = getTrackDataCache();
        const newTrackDataCache = { ...trackDataCache, [currentFilterHash]: data.trackData };
        sessionStorage.setItem("trackDataCache", JSON.stringify(newTrackDataCache));
      } catch (error) {
        console.error("Error fetching track data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!trackData.length || lastFilterHash !== currentFilterHash) {
      fetchTrackData();
    }
  }, [fetchFilter, lastFilterHash, trackData.length]);

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
        setTrackStats(prevStats => {
          const newStats: Record<string, TrackStats> = {};
          Object.keys(stats).forEach(key => {
            const trackHash = sha1(stats[key].trackId + lastFilterHash);
            newStats[trackHash] = stats[key];
          });
          return { ...prevStats, ...newStats };
        });
        // Append to cache
        const trackStatsCache = getTrackStatsCache();
        const newTrackStatsCache = { ...trackStatsCache, [lastFilterHash]: trackStats };
        sessionStorage.setItem("trackStatsCache", JSON.stringify(newTrackStatsCache));
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

  // Apply local filtering and sorting to tracks
  const filteredTracks = useMemo(() => {
    // Apply search filter if present
    let filtered = trackData;

    if (localFilter.search) {
      const searchLower = localFilter.search.toLowerCase();
      filtered = filtered.filter(track =>
        track.name.toLowerCase().includes(searchLower) ||
        track.artists.some(artist => artist.name.toLowerCase().includes(searchLower)) ||
        track.album.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply local sorting
    if (localFilter.sort) {
      const sortFunction = localFilter.sort.func;
      filtered = [...filtered].sort(sortFunction);

      // Apply reverse ordering if needed
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
      *:first:mt-5 *:last:mb-10
      ${className}
    `}>
      {isLoading && new Array(20).fill(0).map((_, i) => (
        <SkeletonTrackElement key={`skeleton-${i}`} />
      ))}
      {!isLoading && filteredTracks.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          Inget matchar aktiva filtret.
        </div>
      )}
      {!isLoading && filteredTracks.map((track, i) => (
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