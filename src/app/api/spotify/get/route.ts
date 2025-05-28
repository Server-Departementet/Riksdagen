import type { Track, TrackWithMeta } from "@/app/spotify/types";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Auth request with clerk
  if (((await auth()).sessionClaims?.metadata as { role: string })?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  const trackIds = params.get("tracks")?.split(",") || [];

  // Read DB
  const dbTracks: Track[] = (await prisma.track.findMany({
    where: {
      id: {
        in: trackIds,
      },
    },
    include: {
      album: true,
      artists: true,
    },
  }));
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
  const tracks: TrackWithMeta[] = await Promise.all(dbTracks
    .map(async track => {
      const thesePlays = dbTrackPlays.filter(play => play.trackId === track.id);
      const totalMS: number = thesePlays.reduce((acc, play) => acc + play.track.duration, 0);
      const totalPlays: number = thesePlays.length;
      const playsPerUser: Record<string, number> = thesePlays.reduce((acc, play) => {
        acc[play.userId] = (acc[play.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return {
        ...track,
        totalMS,
        totalPlays,
        playsPerUser,
        color: await getTrackBGColor(track.album.url),
      }
    }));

  return NextResponse.json({ tracks: JSON.stringify(tracks) }, { status: 200 });
}