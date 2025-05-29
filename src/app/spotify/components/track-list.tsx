"use client";

import { useFilterContext } from "@/app/spotify/filter-context";
import { useEffect, useState } from "react";
import { TrackElement } from "@/app/spotify/components/track-element";
import { TrackWithMeta } from "@/app/spotify/types";

if (typeof window !== "undefined" && !localStorage.getItem("trackCache")) localStorage.setItem("trackCache", "{}");
const trackCache: Record<string, TrackWithMeta> = JSON.parse(
  typeof window !== "undefined" ? localStorage.getItem("trackCache") || "{}" : "{}"
);

export default function TrackList() {
  const { filter } = useFilterContext();
  const [trackIndices, setTrackIndices] = useState<string[]>([]);
  const [hasFetchedIndex, setHasFetchedIndex] = useState<boolean>(false);

  // Fetch track indices based on the current filter
  useEffect(() => {
    if (hasFetchedIndex) return;

    // Post filter to /api/spotify/index to get track ids
    const fetchIndex = async () => {
      const response = await fetch("/api/spotify/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filter),
      });

      if (!response.ok) {
        console.error("Failed to fetch index:", response.statusText);
        return;
      }

      const data = await response.json();

      if (!data.trackIds || !Array.isArray(data.trackIds)) {
        console.error("Invalid response format:", data);
        return;
      }

      setTrackIndices(data.trackIds);
      setHasFetchedIndex(true);
    }
    fetchIndex();
  }, [filter, hasFetchedIndex]);

  return (
    <ul
      className={`
        max-h-[80dvh] md:max-h-auto
        h-[80dvh] md:h-auto
        w-full md:w-1/2
        p-4 first:mt-5 
        flex-2 lg:flex-none 
        overflow-y-auto 
        flex flex-col 
        gap-y-3
      `}
      id="filtered-output-list"
    >
      <p className="text-sm text-gray-500 w-full text-center md:text-start">{trackIndices.length} resultat</p>
      {trackIndices.length > 0 ?
        // Track element handles loading state internally
        trackIndices.map((id, i) => <TrackElement trackId={id} key={"track-element-" + i} index={i} cachedTrackData={trackCache[id]} />)
        :
        // Skeletons while fetching indices
        new Array(20).fill(0).map((_, i) => <TrackElement trackId={""} waitingForId={true} key={"track-element-" + i} index={i} />)
      }
    </ul>
  );
}