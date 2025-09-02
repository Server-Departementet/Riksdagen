"use client";

import { TrackElement, SkeletonTrackElement } from "@/app/spotify/components/track";
import { useSpotifyContext } from "../context/spotify-context";

export default function TrackList({ className = "" }: { className?: string }) {
  const { spotifyContext: { tracks, resultCount, lastFetchDuration } } = useSpotifyContext();

  return (
    <ul className={`
      overflow-y-auto 
      max-h-screen
      flex flex-col items-center
      gap-y-3
      px-6 sm:ps-0
      *:first:mt-3 *:last:mb-10
      w-1/2
      ${className}
    `}>
      {/* Stats */}
      <p className="text-sm opacity-60 font-normal w-full text-center sm:text-start">
        {resultCount} resultat
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        {lastFetchDuration} ms
      </p>

      {/* Tracks / Skeletons */}
      {tracks.length ? tracks.map((track, i) =>
        <TrackElement
          key={`track-${track.id}`}
          trackData={track}
          lineNumber={i + 1}
        />)
        :
        new Array(20).fill(0).map((_, i) => <SkeletonTrackElement key={"track-skeleton-" + i} />)
      }

      {/* No results */}
      {tracks.length === 0 &&
        <div className="py-10 text-center text-gray-500">
          Inget matchar aktiva filtret.
        </div>
      }
    </ul>
  );
}