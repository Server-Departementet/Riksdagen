"use client";

import type { Track, TrackStats } from "@/app/spotify/types";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";

export default function TrackElement({
  trackData: track,
  trackStats: stats,
  lineNumber,
  className = "",
  plays = [],
}: {
  trackData: Track & Partial<TrackStats>
  trackStats: TrackStats | null;
  lineNumber: number;
  className?: string;
  plays?: (Track & Partial<TrackStats>)[];
}) {
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const prettyPlayCount = stats && `${stats.totalPlays} ${stats.totalPlays > 1 ? "gånger" : "gång"}`;
  const prettyPlaytime = stats && `${Math.floor(stats.totalMS / 60000)} min`;

  return (
    <li
      className={`
      h-(--spotify-track-height) min-h-(--spotify-track-height) max-h-(--spotify-track-height) 
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
        className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square bg-gray-200"
        src={track.image ?? CrownSVG} alt="Låtbild"
      />

      {/* Track Title */}
      <h5 className={`
          col-start-2 row-start-1 col-span-2
          leading-5 py-1 overflow-x-hidden whitespace-nowrap text-ellipsis overflow-y-hidden
        `}>
        {track.name}
      </h5>

      {/* Artists and album */}
      <p className={`
        col-start-2 row-start-2 col-span-2 
        pb-1 leading-4 
        text-sm
        opacity-75 
        whitespace-nowrap text-ellipsis overflow-x-hidden
      `}>
        {track.artists.map((a, i) =>
          <Fragment key={`artist-${i}-${a.id}-${track.id}`}>
            <Link href={a.url}
              className="font-semibold"
              target="_blank" rel="noopener noreferrer">
              {a.name}
            </Link>
            {i < track.artists.length - 1 && <span>,&nbsp;</span>}
          </Fragment>
        )}
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        <Link href={track.album.url} target="_blank" rel="noopener noreferrer">
          {track.album.name}
        </Link>
      </p>

      {/* Stats */}
      <div className="row-span-2 col-start-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
        {/* Duration (long) */}
        <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time (long) */}
        {stats
          ? (<p className="hidden sm:block">Har lyssnats på {prettyPlayCount} ({prettyPlaytime})</p>)
          : <p className="hidden sm:block">&middot;&middot;&middot;</p>
        }

        {/* Duration (short) */}
        <p className="block sm:hidden">Längd {prettyDuration}</p>
        {/* Listening time (short) */}
        {stats
          ? (<p className="block sm:hidden">{prettyPlayCount} ({prettyPlaytime})</p>)
          : <p className="block sm:hidden">&middot;&middot;&middot;</p>
        }
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
        <Image width={21} height={21} className="size-5.25" src={SpotifyIconSVG} alt="Spotify" />

        {/* Hides on smaller screens for space savings */}
        <span className="hidden lg:block">
          Öppna i Spotify
        </span>
      </Button>
    </Link>
  );
}

export function SkeletonTrackElement() {
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