"use client";

import { useFilterContext } from "@/app/spotify/filter-context";
import { useEffect, useState } from "react";
import { TrackElement } from "@/app/spotify/components/track-element";
import { TrackWithMeta } from "@/app/spotify/types";

// @ts-expect-error - It does not have types
const hashes = await import("jshashes");
const hash = (string: string) => (new hashes.SHA1).hex(string);

// Remove old local storage cache if it exists
if (typeof window !== "undefined" && localStorage.getItem("trackCache")) localStorage.removeItem("trackCache");

if (typeof window !== "undefined" && !sessionStorage.getItem("trackCache")) sessionStorage.setItem("trackCache", "{}");
const trackCache: Record<string, TrackWithMeta> = JSON.parse(
  typeof window !== "undefined" ? sessionStorage.getItem("trackCache") || "{}" : "{}"
);

export default function TrackList() {
  const { filter } = useFilterContext();
  const [filterHash, setFilterHash] = useState<string>(hash(JSON.stringify(filter)));
  const [trackIndices, setTrackIndices] = useState<string[]>([]);
  const [trackSearchTerm, setTrackSearchTerm] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch track indices whenever the filter changes
  useEffect(() => {
    setLoading(true);
    setTrackIndices([]);
    setTrackSearchTerm([]);

    // Update the filter hash
    setFilterHash(hash(JSON.stringify(filter)));

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
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.trackIds || !Array.isArray(data.trackIds) || !data.trackSearchTerm || !Array.isArray(data.trackSearchTerm)) {
        console.error("Invalid response format:", data);
        setLoading(false);
        return;
      }

      setTrackIndices(data.trackIds);
      setTrackSearchTerm(data.trackSearchTerm);
      setLoading(false);
    };

    fetchIndex();
  }, [filter]);

  return (
    <ul
      className={`
        max-h-[80dvh] md:max-h-auto
        h-[80dvh] md:h-auto
        w-full
        flex-2
        p-4 first:mt-5
        overflow-y-auto
        flex flex-col
        gap-y-3
      `}
      id="filtered-output-list"
    >
      <p className="text-sm text-gray-500 w-full text-center md:text-start">{trackIndices.length} resultat</p>
      {loading
        ? new Array(20).fill(0).map((_, i) => <TrackElement trackId={""} waitingForId={true} key={"track-element-" + i} index={i} />)
        : trackIndices.map((id, i) => <TrackElement trackId={id} searchTerm={trackSearchTerm[i]} key={`${id + "-" + filterHash}-outer`} index={i} cachedTrackData={trackCache[id + "-" + filterHash]} />)
      }
    </ul>
  );
}