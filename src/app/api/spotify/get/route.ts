import type { TrackWithMeta } from "@/app/spotify/types";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { compileTrackWithMeta } from "@/app/api/spotify/lib/tracks";

export async function getTrackData(trackIds: string[]): Promise<TrackWithMeta[]> {
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

  return NextResponse.json({ tracks: await getTrackData(trackIds) }, { status: 200 });
}