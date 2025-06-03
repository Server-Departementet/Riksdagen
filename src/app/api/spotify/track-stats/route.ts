import type { TrackStats } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sha1 } from "@/lib/hash";

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body;

  const trackDataWithPlays = await prisma.track.findMany({
    orderBy: {
      TrackPlay: { _count: 'desc' },
    },
    include: {
      album: true,
      artists: true,
      TrackPlay: true,
    },
  });

  // const tracksWithMeta: TrackWithStats[] = await Promise.all(trackDataWithPlays.map(async (track) => {
  //   const totalPlays = track.TrackPlay.length;
  //   const totalMS = totalPlays * (track.duration || 0);
  //   const playsPerUser: Record<string, number> = {}; // Leave empty for now
  //   return {
  //     ...track,
  //     totalPlays,
  //     totalMS,
  //     playsPerUser,
  //     color: await getTrackBGColor(track.image || ""),
  //   }
  // }));

  const trackStats: Record<string, TrackStats> = {};
  trackDataWithPlays.forEach(track => {
    const totalPlays = track.TrackPlay.length;
    const totalMS = totalPlays * (track.duration || 0);
    const playsPerUser: Record<string, number> = {};

    track.TrackPlay.forEach(play => {
      playsPerUser[play.userId] = (playsPerUser[play.userId] || 0) + 1;
    });

    const trackHash = sha1(track.id + sha1(JSON.stringify(filter)));

    trackStats[trackHash] = {
      trackId: track.id,
      totalPlays,
      totalMS,
      playsPerUser,
    };
  });

  return NextResponse.json({ trackStats });
}