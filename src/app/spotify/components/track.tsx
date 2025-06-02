"use client";

import type { TrackWithMeta } from "@/app/spotify/types";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Track({
  trackData: track,
  lineNumber,
  className = "",
}: {
  trackData: TrackWithMeta
  lineNumber: number;
  className?: string;
}) {
  return (
    <li
      className={`
      h-(--spotify-track-height) min-h-(--spotify-track-height) 
      flex flex-row items-center
      gap-x-0.5
      rounded-[4px]
      w-2/3 max-w-prose min-w-[300px]
      bg-zinc-100
      ${className}
    `}>
      <div
        className="flex-1 grid grid-cols-[(--spotify-track-height)_1fr_max-content_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[(--spotify-track-height)] overflow-hidden gap-x-2 gap-y-1"
        {...track.color ? { style: { backgroundColor: track.color } } : {}}
      >
        {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
        <Image width={128} height={128} className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

        <h5 className={`
          col-start-2 row-start-1 col-span-2
          leading-5 py-1 overflow-x-hidden whitespace-nowrap text-ellipsis overflow-y-hidden
        `}>
          {track.name}
        </h5>

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
      </div>

      <span>{lineNumber}</span>
    </li>
  );
}

function OpenInSpotifyButton({ trackURL }: { trackURL: string }) {
  return (
    <Link href={trackURL} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end z-10" target="_blank" rel="noopener noreferrer">
      <Button tabIndex={-1} className="mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5">
        <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />

        {/* Hides on smaller screens for space savings */}
        <span className="hidden lg:block">
          Öppna i Spotify
        </span>
      </Button>
    </Link>
  );
}