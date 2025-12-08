"use client";

import type { FilterHash, Track, TrackId, TrackStats, TrackWithStats } from "@/app/spotify/types";
import TrackElement, { SkeletonTrackElement } from "@/app/spotify/components/track";
import { useEffect, useState, useMemo, useRef } from "react";
import { useFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { useLocalFilterContext } from "@/app/spotify/context/local-filter-context";
import { sha1 } from "@/lib/hash";
import { decodeTrackData, decodeTrackIndex, decodeTrackStats } from "@/lib/spotify.proto";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";

export default function TrackList({ className = "" }: { className?: string }) {
  const { fetchFilter } = useFetchFilterContext();
  const { localFilter } = useLocalFilterContext();
  const [trackIndex, setTrackIndex] = useState<TrackId[]>([]);
  const [trackData, setTrackData] = useState<Record<TrackId, Track>>({});
  const [trackStats, setTrackStats] = useState<Record<TrackId, TrackStats>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchTime, setFetchTime] = useState<number>(0);

  // To prevent excessive re-renders, we use refs instead of state for caches
  const trackIndexRef = useRef<TrackId[]>(trackIndex);
  const trackDataCache = useRef<Record<TrackId, Track>>({});
  const trackStatsCache = useRef<Record<FilterHash, TrackStats[]>>({});

  const currentFilterHash = useMemo(() => sha1(JSON.stringify(fetchFilter)), [fetchFilter]);

  // Load cached data from localStorage and sessionStorage on initial render
  useEffect(() => {
    // Local storage
    try {
      const cachedData = localStorage.getItem("spotifyTrackData");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData) as Record<TrackId, Track>;
        // Initialize the track data cache with the parsed data
        Object.entries(parsedData).forEach(([id, track]) => {
          trackDataCache.current[id] = track;
        });
      }
    }
    catch (error) {
      console.error("Error loading cached track data:", error);
      // Clear the cache if there's an error
      localStorage.removeItem("spotifyTrackData");
      trackDataCache.current = {};
    }

    // Session storage
    try {
      const cachedStats = sessionStorage.getItem("spotifyTrackStats");
      if (cachedStats) {
        const parsedStats = JSON.parse(cachedStats) as Record<FilterHash, TrackStats[]>;
        // Initialize the track stats cache with the parsed stats
        Object.entries(parsedStats).forEach(([hash, stats]) => {
          trackStatsCache.current[hash] = stats;
        });
      }
    }
    catch (error) {
      console.error("Error loading cached track stats:", error);
      // Clear the cache if there's an error
      sessionStorage.removeItem("spotifyTrackStats");
      trackStatsCache.current = {};
    }
  }, []);

  // Update cache on changes in trackData and trackStats with a debounce
  useEffect(() => {
    const handleCacheUpdate = () => {
      // Save track data cache to localStorage
      localStorage.setItem("spotifyTrackData", JSON.stringify(trackDataCache.current));
      // Save track stats cache to sessionStorage
      sessionStorage.setItem("spotifyTrackStats", JSON.stringify(trackStatsCache.current));
    };

    const debounceTimeout = setTimeout(handleCacheUpdate, 1000);

    return () => clearTimeout(debounceTimeout);
  }, []);

  // Fetch track index, data and stats from the server or cache
  useEffect(() => {
    const startTime = performance.now();

    const fetchTrackIndex = async () => {
      setIsLoading(true);
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
      trackIndexRef.current = decodedIndex.trackIds;
    };

    const fetchTrackData = async () => {
      if (fetchFilter.users.length === 0) {
        console.warn("No users selected in fetch filter, skipping track data fetch.");
        setTrackData({});
        return;
      }

      // Cache is a record of TrackId to compressed {Track} data so if all tracks in index are already cached, we can skip fetching them again
      if (trackDataCache && trackIndexRef.current && trackIndexRef.current.every(id => id in trackDataCache)) {
        setTrackData(Object.fromEntries(trackIndexRef.current.map(id => [id, trackDataCache.current[id]])));
        return;
      }

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

      const { trackData: encodedTrackData } = await response.json() as { trackData: Uint8Array };
      // @ts-expect-error - This is checking the buffersize
      if (encodedTrackData.data.length === 0) {
        console.warn("Received empty track data, this might be due to an empty filter or no tracks matching the filter.");
        setTrackData({});
        return;
      }
      const trackData = decodeTrackData(encodedTrackData).trackData;

      setTrackData(Object.fromEntries(trackData.map(t => [t.id, t])));

      trackDataCache.current = {
        ...trackDataCache.current,
        ...Object.fromEntries(trackData.map(t => [t.id, t])),
      };
    }

    const fetchTrackStats = async () => {
      if (fetchFilter.users.length === 0) {
        console.warn("No users selected in fetch filter, skipping track stats fetch.");
        setTrackStats({});
        return;
      }

      // Cache is a record of FilterHash to compressed {TrackStats} data so if current filter hash is already cached, we can skip fetching it again
      if (trackStatsCache.current[currentFilterHash]) {
        const cachedStats = trackStatsCache.current[currentFilterHash];
        setTrackStats(Object.fromEntries(cachedStats.map(t => [t.trackId, t])));
        return;
      }

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

      const { trackStats: encodedTrackStats } = await response.json() as { trackStats: Uint8Array };
      // @ts-expect-error - This is checking the buffersize
      if (encodedTrackStats.data.length === 0) {
        console.warn("Received empty track stats, this might be due to an empty filter or no tracks matching the filter.");
        setTrackStats({});
        return;
      }
      const decodedTrackStats = decodeTrackStats(encodedTrackStats);
      setTrackStats(Object.fromEntries(decodedTrackStats.trackStats.map(t => [t.trackId, t])));

      trackStatsCache.current[decodedTrackStats.filterHash] = decodedTrackStats.trackStats;
    }

    fetchTrackIndex()
      .then(() => Promise.all([
        fetchTrackData(),
        fetchTrackStats(),
      ]))
      .then(() => {
        const endTime = performance.now();
        setFetchTime(Math.round(endTime - startTime));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentFilterHash, fetchFilter, trackDataCache, trackStatsCache]);

  // Apply local filtering and sorting
  const filteredTracks: TrackWithStats[] = useMemo(() => {
    let filtered = Object.values(trackData).map(t => ({ ...t, ...trackStats[t.id] }));

    // Apply album filter from local filter (if any)
    if (localFilter.album?.include && localFilter.album.include.length > 0) {
      const includedAlbumIds = new Set(localFilter.album.include);
      filtered = filtered.filter(track => includedAlbumIds.has(track.album.id));
    }

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
      filtered = [...filtered].sort(sortingFunctions[localFilter.sort].func);

      if (localFilter.reverseOrder) {
        filtered = filtered.reverse();
      }
    }

    return filtered;
  }, [trackData, localFilter, trackStats]);

  // const groupedTracks: TrackWithStats[] = useMemo(() => {
  //   const withFlattenedKeys: TrackWithStats[] = filteredTracks.map(t => ({ ...t, id: `${t.name}-${t.artists.map(a => a.id).sort().join(",")}-${t.duration}` }));
  //   // console.log(withFlattenedKeys.sort((a, b) => a.id.localeCompare(b.id)));

  //   return [];
  // }, [filteredTracks]);

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
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        {fetchTime} ms
      </p>

      {/* Skeletons */}
      {isLoading && new Array(20).fill(0).map((_, i) =>
        <SkeletonTrackElement key={`skeleton-${i}`} />
      )}

      {/* No result */}
      {!isLoading && filteredTracks.length === 0 &&
        <div className="py-10 text-center text-gray-500">
          Nuvarande filter gav ingen resultat.
        </div>
      }

      {/* Results */}
      {!isLoading && filteredTracks.map((track, i) =>
        <TrackElement
          trackData={track}
          trackStats={track}
          lineNumber={i + 1}
          key={`track-${track.id}`}
          // plays={track.plays}
        />
      )}
    </ul>
  );
}