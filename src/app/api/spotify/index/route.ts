import { trackSortingFunctions, TrackSortingFunctions, validTrackSortingFunctions } from "@/app/spotify/functions/track-sorting";
import type { FilterPacket, TrackWithMeta } from "@/app/spotify/types";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Auth request with clerk
  if (((await auth()).sessionClaims?.metadata as { role: string })?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const filter = (await req.json()) as FilterPacket;

  if (!filter || !filter.sorting || !validTrackSortingFunctions.includes(filter.sorting.sortBy) || !filter.users || !filter.genres || !filter.artists || !filter.albums) {
    return NextResponse.json({ error: "Invalid filter packet" }, { status: 400 });
  }

  const allTracks = await prisma.track.findMany({
    include: {
      album: true,
      artists: true,
    },
  });
  const allTrackPlays = await prisma.trackPlay.findMany({
    include: {
      track: {
        include: {
          album: true,
          artists: true,
        },
      },
    },
  });

  const allTracksWithMeta: TrackWithMeta[] = allTracks.map(track => {
    const thisPlays = allTrackPlays.filter(play => play.trackId === track.id)

    const totalMS: number = thisPlays
      .reduce((acc, play) => acc + play.track.duration, 0);

    const playsPerUser: Record<string, number> = thisPlays.reduce((acc, play) => {
      acc[play.userId] = (acc[play.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPlays: number = Object.values(playsPerUser).reduce((acc, count) => acc + count, 0);

    return { ...track, totalMS, playsPerUser, totalPlays };
  });

  const sortFunction = trackSortingFunctions[
    (validTrackSortingFunctions
      .map(func => func.toLowerCase())
      .find(func => func === filter.sorting.sortBy)
      || "default"
    ) as TrackSortingFunctions
  ];

  const resultingTracks = allTracksWithMeta
    .sort(sortFunction)
    .map(track => {
      return track.id;
    });

  const res = {
    trackIds: resultingTracks,
    // tracks: [] as string[],
  }

  return NextResponse.json(res);
}