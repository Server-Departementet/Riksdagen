"use client";

import type { TrackWithStats } from "../types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import { CopyLinkButton } from "./copy-link";
import { useCallback, useEffect, useRef, useState } from "react";

export function InnerTrackElement({
  track,
  bgColor,
  minutes,
  seconds,
  prettyDuration,
  prettyPlayCount,
  prettyPlaytime,
  username,
  className = "",
}: {
  track: TrackWithStats,
  bgColor: string,
  minutes: number,
  seconds: number,
  prettyDuration: string,
  prettyPlayCount: string,
  prettyPlaytime: string,
  username: string,
  className?: string,
}) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const domRef = useRef<HTMLDivElement>(null);

  const handleScrollEvent = useCallback(() => {
    if (!domRef.current) return;
    const rect = domRef.current.getBoundingClientRect();
    const isInViewport = rect.top >= -256 && rect.bottom <= window.innerHeight + 256;
    setIsVisible(isInViewport);
  }, [domRef]);

  useEffect(() => {
    if (!domRef.current) {
      domRef.current = document.getElementById(`${track.id}-outer`) as HTMLDivElement;
    }

    const list = document.getElementById("filtered-output-list");
    if (!list) return;

    list.addEventListener("scroll", handleScrollEvent, { passive: true });
    handleScrollEvent(); // Check if element is in viewport on mount

    return () => {
      list.removeEventListener("scroll", handleScrollEvent);
      if (domRef.current) domRef.current = null;
    }
  }, [handleScrollEvent, track.id]);

  return isVisible ? (
    <div
      id={`${track.id}-inner`}
      className={`grid grid-cols-[128px_1fr_max-content_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[128px] overflow-hidden gap-x-2 gap-y-1 ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* ID to jump to. Offset to give more control */}
      <div id={track.id} className="col-start-1 row-start-1 relative -translate-y-32 h-0 -z-50"></div>

      {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
      <Image width={128} height={128} className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

      {/* Track info */}
      <h5 className="col-start-2 row-start-1 col-span-2 leading-5 py-1 overflow-x-auto whitespace-nowrap text-ellipsis overflow-y-hidden">{track.name}</h5>
      {/* Artists */}
      <p className="col-start-2 row-start-2 col-span-2 pb-1 font-semibold text-sm opacity-75 leading-4 whitespace-nowrap overflow-y-hidden overflow-x-auto">{track.artists.map(artist => artist.name).join(", ")}</p>

      {/* Stats */}
      <div className="row-span-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
        {/* Duration (long) */}
        <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time (long) */}
        <p className="hidden sm:block">{username} har lyssnat {prettyPlayCount} ({prettyPlaytime})</p>

        {/* Duration (short) */}
        <p className="block sm:hidden">Längd {prettyDuration}</p>
        {/* Listening time (short) */}
        <p className="block sm:hidden">{prettyPlayCount} ({prettyPlaytime})</p>
      </div>

      {/* Spotify Link */}
      <Link href={track.url} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end z-10" target="_blank" rel="noopener noreferrer">
        <Button tabIndex={-1} className="mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5">
          <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
          <span className="hidden sm:block">
            Öppna i Spotify
          </span>
        </Button>
      </Link>

      {/* Copy link button */}
      <CopyLinkButton className="mt-1.5 sm:mt-2 me-1.5 sm:me-2 col-start-4 row-start-1 row-span-2 justify-self-end self-start z-10" trackId={track.id} />
    </div>
  )
    : <span id={`${track.id}-inner`} className={`${className}`}></span>;
}