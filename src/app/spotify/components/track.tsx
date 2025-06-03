"use client";

import type { TrackStats, TrackWithStats } from "@/app/spotify/types";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrackElement({
  trackData: track,
  statOverride: stats,
  lineNumber,
  className = "",
}: {
  trackData: TrackWithStats
  statOverride: TrackStats | null;
  lineNumber: number;
  className?: string;
}) {
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const prettyPlayCount = stats
    ? `${stats.totalPlays} ${stats.totalPlays > 1 ? "gånger" : "gång"}`
    : `${track.totalPlays} ${track.totalPlays > 1 ? "gånger" : "gång"}`

  const prettyPlaytime = stats
    ? `${Math.floor(stats.totalMS / 60000)} min`
    : `${Math.floor(track.totalMS / 60000)} min`;

  return (
    <li
      className={`
      h-(--spotify-track-height) min-h-(--spotify-track-height) 
      w-full xl:w-2/3 max-w-prose min-w-[300px]
      bg-zinc-100
      flex-1 
      grid 
      grid-cols-[128px_1fr_max-content_max-content] 
      grid-rows-[max-content_max-content_1fr_max-content] 
      rounded-[4px] 
      gap-x-2 gap-y-1
      overflow-hidden 
      ${className}
    `}
      {...track.color ? { style: { backgroundColor: track.color } } : {}}
    >
      {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
      <Image
        width={128} height={128}
        className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square"
        src={track.image ?? CrownSVG} alt="Låtbild"
      />

      <h5 className={`
          col-start-2 row-start-1 col-span-2
          leading-5 py-1 overflow-x-hidden whitespace-nowrap text-ellipsis overflow-y-hidden
        `}>
        {track.name}
      </h5>

      {/* Artists */}
      <p className={`
        col-start-2 row-start-2 col-span-2 
        pb-1 leading-4 
        font-semibold text-sm 
        opacity-75 
        whitespace-nowrap text-ellipsis overflow-x-hidden
      `}>
        {track.artists.map(artist => artist.name).join(", ")}
      </p>

      {/* Stats */}
      <div className="row-span-2 col-start-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
        {/* Duration (long) */}
        <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time (long) */}
        {stats && (<p className="hidden sm:block">Har lyssnats på {prettyPlayCount} ({prettyPlaytime})</p>)}

        {/* Duration (short) */}
        <p className="block sm:hidden">Längd {prettyDuration}</p>
        {/* Listening time (short) */}
        {stats && (<p className="block sm:hidden">{prettyPlayCount} ({prettyPlaytime})</p>)}
      </div>

      {/* Line number */}
      <div className="col-start-3 col-span-2 row-start-1 flex flex-row items-center justify-end px-1">
        {/* Circle/Pill */}
        <span className="bg-zinc-100 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
          {/* Number */}
          <span className="text-center align-middle text-xs">{lineNumber}</span>
        </span>
      </div>

      {/* Spotify Link */}
      <OpenInSpotifyButton trackURL={track.url} />
    </li>
  );
}

function OpenInSpotifyButton({ trackURL }: { trackURL: string }) {
  return (
    <Link href={trackURL} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end" target="_blank" rel="noopener noreferrer">
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