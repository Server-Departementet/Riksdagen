"use client";

import type { TrackWithMeta } from "@/app/spotify/types";
import Image from "next/image";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import { OpenInSpotifyButton } from "@/app/spotify/components/track-buttons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFilterContext } from "../filter-context";

// @ts-expect-error - It does not have types
const hashes = await import("jshashes");
const hash = (string: string) => (new hashes.SHA1).hex(string);

const CULLING_MARGIN = 1024; // Pixels outside viewport to cull

export function InnerTrackElement({
  trackId,
  index,
  searchTerm = "",
  waitingForId = false,
  cachedTrackData = null,
}: {
  trackId: string;
  index: number;
  searchTerm?: string;
  waitingForId?: boolean;
  cachedTrackData?: TrackWithMeta | null;
}) {
  const { filter } = useFilterContext();
  const [filterHash, setFilterHash] = useState<string>(hash(JSON.stringify(filter)));
  const [isVisible, setIsVisible] = useState<boolean>(index < 8);
  const [waitingForTrackData, setWaitingForTrackData] = useState<boolean>(true);
  const [trackData, setTrackData] = useState<TrackWithMeta | null>(cachedTrackData || null);
  const domRef = useRef<HTMLDivElement>(null);

  // Cull on scroll
  const handleScrollEvent = useCallback(() => {
    if (!domRef.current) return;
    const rect = domRef.current.getBoundingClientRect();
    const isInViewport = rect.top >= -CULLING_MARGIN && rect.bottom <= window.innerHeight + CULLING_MARGIN;
    setIsVisible(isInViewport);
  }, [domRef]);

  // Attach scroll event listeners on mount
  useEffect(() => {
    if (!domRef.current) {
      domRef.current = document.getElementById(`${trackId}-inner`) as HTMLDivElement;
    }

    const list = document.getElementById("filtered-output-list");
    if (!list) return;

    window.addEventListener("resize", handleScrollEvent, { passive: true });
    list.addEventListener("scroll", handleScrollEvent, { passive: true });
    handleScrollEvent(); // Check if element is in viewport on mount

    return () => {
      list.removeEventListener("scroll", handleScrollEvent);
      if (domRef.current) domRef.current = null;
    }
  }, [handleScrollEvent, trackId]);

  // When trackId is set, fetch track data on /api/spotify/track?ids={trackId}
  useEffect(() => {
    if (!trackId || waitingForId || !isVisible) return;

    // Update filter hash when filter changes
    setFilterHash(hash(JSON.stringify(filter)));

    // If trackData is already set, no need to fetch again
    if (trackData) {
      setWaitingForTrackData(false);
      return;
    }

    // If trackData is cached, use it
    const cachedTrack = JSON.parse(sessionStorage.getItem("trackCache") || "{}")[trackId + "-" + filterHash];
    if (cachedTrack) {
      setTrackData(cachedTrack);
      setWaitingForTrackData(false);
      return;
    }

    // Fetch track data
    setWaitingForTrackData(true);
    fetch(`/api/spotify/track?ids=${trackId}`, {
      body: JSON.stringify(filter),
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error("Error fetching track data:", data.error);
          setTrackData(null);
        } else {
          setTrackData(data.tracks[0]);
          const trackCache = JSON.parse(sessionStorage.getItem("trackCache") || "{}");
          trackCache[trackId + "-" + filterHash] = data.tracks[0];
          sessionStorage.setItem("trackCache", JSON.stringify(trackCache));
        }
      })
      .catch(err => {
        console.error("Error fetching track data:", err);
        setTrackData(null);
      })
      .finally(() => {
        setWaitingForTrackData(false);
      });
  }, [trackId, waitingForId, trackData, isVisible, filter, filterHash]);

  return (
    <div ref={domRef} id={`${trackId}-inner`} className="min-h-[128px] h-[128px] w-full">
      {
        // TODO - Reconsider view culling if necessary
        // (!isVisible && trackData) ? <div>{trackData.name} - {trackData.artists.map(a => a.name).join(", ")}</div>
        //   :
        //   (!isVisible) ? <div></div>
        // :
        (waitingForId || waitingForTrackData) ? <SkeletonTrackElement />
          :
          (trackData) ? <LoadedTrackElement track={trackData} />
            :
            <div className="min-h-[128px] h-[128px] flex-1 flex flex-row items-center justify-center text-xl">Fel i inladdningen</div>
      }
    </div>
  );
}

function LoadedTrackElement({ track }: { track: TrackWithMeta }) {
  // Track stats
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const prettyPlayCount = `${track.totalPlays} ${track.totalPlays > 1 ? "gånger" : "gång"}`;
  const prettyPlaytime = `${Math.floor(track.totalMS / 60000)} min`;

  return (
    <div
      className="grid grid-cols-[128px_1fr_max-content_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[128px] overflow-hidden gap-x-2 gap-y-1"
      {...track.color ? { style: { backgroundColor: track.color } } : {}}
    >
      {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
      <Image width={128} height={128} className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

      {/* Track info */}
      <h5 className={`
        col-start-2 row-start-1 col-span-2
        leading-5 py-1 overflow-x-hidden whitespace-nowrap text-ellipsis overflow-y-hidden
      `}>{track.name}</h5>
      {/* Artists */}
      <p className="col-start-2 row-start-2 col-span-2 pb-1 font-semibold text-sm opacity-75 leading-4 whitespace-nowrap overflow-y-hidden overflow-x-auto">{track.artists.map(artist => artist.name).join(", ")}</p>

      {/* Stats */}
      <div className="row-span-2 col-start-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
        {/* Duration (long) */}
        <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time (long) */}
        <p className="hidden sm:block">Har lyssnats på {prettyPlayCount} ({prettyPlaytime})</p>

        {/* Duration (short) */}
        <p className="block sm:hidden">Längd {prettyDuration}</p>
        {/* Listening time (short) */}
        <p className="block sm:hidden">{prettyPlayCount} ({prettyPlaytime})</p>
      </div>

      {/* Spotify Link */}
      <OpenInSpotifyButton trackURL={track.url} />

      {/* Copy link button */}
      {/* <CopyLinkButton
        trackId={track.id}
        className="mt-1.5 sm:mt-2 me-1.5 sm:me-2 col-start-4 row-start-1 row-span-2 justify-self-end self-start z-10"
      /> */}
    </div>
  );
}

function SkeletonTrackElement() {
  return (
    <div className="flex-1 h-[128px] flex flex-row gap-x-6">
      {/* "Img" */}
      <div className="size-[128px] rounded-[4px] bg-gray-600 pulse-animation"></div>

      <div className="flex-1">
        {/* "Track name" */}
        <div className="h-5 w-[16ch] md:w-1/2 bg-gray-300 p-2 mt-5 rounded-sm pulse-animation"></div>
      </div>
    </div>
  );
}