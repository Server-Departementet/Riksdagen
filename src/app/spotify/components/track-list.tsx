"use client";

import { TrackElement, SkeletonTrackElement } from "@/app/spotify/components/track";
import { useSpotifyContext } from "../context/spotify-context";

export default function TrackList({ className = "" }: { className?: string }) {
  const { spotifyContext: { tracks } } = useSpotifyContext();

  return (
    <ul className={`
      overflow-y-auto 
      flex flex-col
      gap-y-3
      px-6 sm:ps-0
      *:first:mt-3 *:last:mb-10
      w-fit
      ${className}
    `}>
      {tracks.length ? tracks.map((track, i) =>
        <TrackElement
          key={`track-${track.id}`}
          trackData={track}
          lineNumber={i + 1}
        />)
        :
        new Array(20).fill(0).map((_, i) => <SkeletonTrackElement key={"track-skeleton-" + i} />)
      }

      {/* Stats */}
      {/* <p className="text-sm opacity-60 font-normal w-full text-center sm:text-start">
        {filteredTracks.length} resultat
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        {fetchTime} ms
      </p> */}

      {/* Skeletons */}
      {/* {isLoading && new Array(20).fill(0).map((_, i) =>
        <SkeletonTrackElement key={`skeleton-${i}`} />
      )} */}

      {/* No result */}
      {/* {!isLoading && filteredTracks.length === 0 &&
        <div className="py-10 text-center text-gray-500">
          Inget matchar aktiva filtret.
        </div>
      } */}

      {/* Results */}
      {/* {!isLoading && filteredTracks.map((track, i) =>
        <TrackElement
          trackData={track}
          trackStats={trackStats[track.id]}
          lineNumber={i + 1}
          key={`track-${track.id}`}
        />
      )} */}
    </ul>
  );
}