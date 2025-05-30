"use client";

import { InnerTrackElement } from "@/app/spotify/components/inner-track-element";
import { TrackWithMeta } from "@/app/spotify/types";

export function TrackElement({
  trackId,
  index,
  waitingForId = false,
  cachedTrackData = null,
}: {
  trackId: string,
  index: number,
  waitingForId?: boolean,
  cachedTrackData?: TrackWithMeta | null,
}) {
  return (
    <div
      className={`
        flex flex-row items-center
        gap-x-0.5
        *:first:flex-1
        rounded-[4px]
        w-full max-w-prose
        min-h-[128px] h-[128px]
        bg-zinc-100
      `}
    >
      <InnerTrackElement
        trackId={trackId}
        index={index}
        waitingForId={waitingForId}
        cachedTrackData={cachedTrackData}
      />

      {/* Index number */}
      <span className="text-lg px-2 text-center">{index + 1}</span>
    </div>
  );
}