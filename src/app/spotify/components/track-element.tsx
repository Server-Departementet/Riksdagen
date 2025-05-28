"use client";

import type { TrackWithMeta } from "@/app/spotify/types";
import { InnerTrackElement } from "@/app/spotify/components/inner-track-element";
import { useEffect, useState } from "react";

// Should ideally be imported from the get-track-color file but it's server side only
const fallbackColor = "var(--color-zinc-100)";

export function TrackElement({
  trackId,
  index,
}: {
  trackId: string,
  index: number,
}) {
  // const [track, setTrack] = useState<TrackWithMeta | null>(null);

  // // Fetch track data on mount if visible
  // useEffect(() => {
  //   if (track) return;
  //   if (!trackId) {
  //     console.error("Track ID is required to fetch track data.");
  //     return;
  //   }

  //   const fetchTrack = async () => {
  //     const response = await fetch(`/api/spotify/get?tracks=${trackId}`);
  //     if (!response.ok) {
  //       console.error("Failed to fetch track:", response.statusText);
  //       return;
  //     }
  //     const data = await response.json();
  //     if (data && data.length > 0) {
  //       setTrack(data[0]);
  //     } else {
  //       console.error("No track data found for ID:", trackId);
  //     }
  //   };

  //   fetchTrack();
  // }, [track, trackId]);


  // Track duration
  // const minutes = Math.floor(track.duration / 60000);
  // const seconds = Math.floor((track.duration % 60000) / 1000);
  // const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // const prettyPlayCount = `${track.totalPlays} ${track.totalPlays > 1 ? "gånger" : "gång"}`;
  // const prettyPlaytime = `${Math.floor(track.totalMS / 60000)} min`;

  return (
    <div
      id={`${trackId}-outer`}
      className={`flex flex-row items-center gap-x-0.5 rounded-[4px] min-h-[128px] h-[128px] bg-zinc-100`}
    >
      {/* <InnerTrackElement
        className="flex-1"
        bgColor={track.color || fallbackColor}
        track={track}
        minutes={minutes}
        seconds={seconds}
        prettyDuration={prettyDuration}
        prettyPlayCount={prettyPlayCount}
        prettyPlaytime={prettyPlaytime}
        username={username}
      /> */}
      <p className="flex-1 p-4">{trackId}</p>

      {/* Index number */}
      <span className="text-lg px-2 text-center">{index + 1}</span>
    </div>
  );
}