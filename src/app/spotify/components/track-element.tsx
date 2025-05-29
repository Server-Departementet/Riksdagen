"use client";

import type { TrackWithMeta } from "@/app/spotify/types";
import { InnerTrackElement } from "@/app/spotify/components/inner-track-element";
import { useEffect, useState } from "react";

export function TrackElement({
  trackId,
  index,
  waitingForId = false,
}: {
  trackId: string,
  index: number,
  waitingForId?: boolean,
}) {
  return (
    <div
      className="flex flex-row items-center *:first:flex-1 gap-x-0.5 rounded-[4px] min-h-[128px] h-[128px] bg-zinc-100"
    >
      <InnerTrackElement
        trackId={trackId}
        waitingForId={waitingForId}
        index={index}
      />

      {/* Index number */}
      <span className="text-lg px-2 text-center">{index + 1}</span>
    </div>
  );
}