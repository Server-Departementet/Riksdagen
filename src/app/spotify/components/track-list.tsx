"use client";

import { useFilterContext } from "@/app/spotify/filter-context";
import { useEffect, useState } from "react";
import { TrackElement } from "@/app/spotify/components/track-element";

export default function TrackList() {
  const { filter } = useFilterContext();
  const [trackIndices, setTrackIndices] = useState<string[]>([]);
  const [hasFetchedIndex, setHasFetchedIndex] = useState<boolean>(false);

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
    <ul className="w-1/2 flex-1 lg:flex-none overflow-y-auto p-4 first:mt-5 flex flex-col gap-y-3">
      {trackIndices.length > 0 &&
        trackIndices.map((id, i) => <TrackElement trackId={id} key={"track-element-" + i} index={i} />)
      }
    </ul>
  );
}