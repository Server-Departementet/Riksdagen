import type { Track, TrackWithMeta } from "@/app/spotify/types";
import TrackElement from "@/app/spotify/components/track";
import { prisma } from "@/lib/prisma";
import { getTrackBGColor } from "../functions/get-track-color";

export default async function TrackList({ className = "" }: { className?: string }) {

  const trackDataWithPlays = await prisma.track.findMany({
    orderBy: {
      TrackPlay: { _count: 'desc' },
    },
    take: 50,
    include: {
      album: true,
      artists: true,
      TrackPlay: true,
    },
  });

  const tracksWithMeta: TrackWithMeta[] = await Promise.all(trackDataWithPlays.map(async (track) => {
    const totalPlays = track.TrackPlay.length;
    const totalMS = totalPlays * (track.duration || 0);
    const playsPerUser: Record<string, number> = {};
    return {
      ...track,
      totalPlays,
      totalMS,
      playsPerUser, // Leave empty for now
      color: await getTrackBGColor(track.image || ""),
    }
  }));

  return (
    <ul className={`
      overflow-y-auto 
      flex flex-col
      gap-y-3
      pe-6 lg:pe-0
      *:first:mt-5 *:last:mb-10
      ${className}
    `}>
      {/* {new Array(15).fill(0).map((_, i) => <Track trackData={} lineNumber={i + 1} key={`track-${i}`} />)} */}
      {tracksWithMeta.map((track, i) => (
        <TrackElement
          trackData={track}
          lineNumber={i + 1}
          key={`track-${track.id}`}
        />
      ))}
    </ul>
  );
}