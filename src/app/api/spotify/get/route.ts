import type { Track, TrackPlay, TrackWithMeta } from "@/app/spotify/types";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

async function compileTrackWithMeta(
  track: Track,
  trackPlays: TrackPlay[]
): Promise<TrackWithMeta> {
  "use cache";

  const thesePlays = trackPlays.filter(play => play.trackId === track.id);
  const totalMS: number = thesePlays.reduce((acc, play) => acc + play.track.duration, 0);
  const totalPlays: number = thesePlays.length;
  const playsPerUser: Record<string, number> = thesePlays.reduce((acc, play) => {
    acc[play.userId] = (acc[play.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const color = track.image ? await getTrackBGColor(track.image) : undefined;

  return {
    ...track,
    totalMS,
    totalPlays,
    playsPerUser,
    color,
  };
}

async function getTrackData(trackIds: string[]): Promise<TrackWithMeta[]> {
  "use cache";

  // Read DB
  const dbTracks = await prisma.track.findMany({
    where: {
      id: {
        in: trackIds,
      },
    },
    include: {
      album: true,
      artists: true,
    },
  });
  const dbTrackPlays = await prisma.trackPlay.findMany({
    where: {
      trackId: {
        in: trackIds,
      },
    },
    include: {
      track: {
        include: {
          album: true,
          artists: true,
        },
      },
    },
  });

  // Compile tracks with metadata
  return Promise.all(
    dbTracks.map(track => compileTrackWithMeta(track, dbTrackPlays))
  );
}

export async function GET(req: NextRequest) {
  // Auth request with clerk
  if (((await auth()).sessionClaims?.metadata as { role: string })?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  const trackIds = params.get("tracks")?.split(",") || [];

  // // Read DB
  // const dbTracks = await prisma.track.findMany({
  //   where: {
  //     id: {
  //       in: trackIds,
  //     },
  //   },
  //   include: {
  //     album: true,
  //     artists: true,
  //   },
  // });
  // const dbTrackPlays = await prisma.trackPlay.findMany({
  //   where: {
  //     trackId: {
  //       in: trackIds,
  //     },
  //   },
  //   include: {
  //     track: {
  //       include: {
  //         album: true,
  //         artists: true,
  //       },
  //     },
  //   },
  // });

  // // Compile tracks with metadata
  // const tracks: TrackWithMeta[] = await Promise.all(
  //   dbTracks.map(track => compileTrackWithMeta(track, dbTrackPlays))
  // );

  return NextResponse.json({ tracks: await getTrackData(trackIds) }, { status: 200 });
}