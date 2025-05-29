import { trackSortingFunctions, TrackSortingFunctions, validTrackSortingFunctions } from "@/app/spotify/functions/track-sorting";
import type { FilterPacket, TrackWithMeta } from "@/app/spotify/types";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { compileTrackWithMeta } from "@/app/api/spotify/lib/tracks";
import { isMinister } from "@/lib/auth";

async function getIdsFromFilter(filter: FilterPacket): Promise<string[]> {
  "use cache";

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

  const allTracksWithMeta: TrackWithMeta[] = await Promise.all(

    allTracks.map(async (track) => compileTrackWithMeta(track, allTrackPlays))
  );

  const sortFunction = trackSortingFunctions[
    (validTrackSortingFunctions
      .map(func => func.toLowerCase())
      .find(func => func === filter.sorting.sortBy)
      || "default"
    ) as TrackSortingFunctions
  ];

  const trackIds = allTracksWithMeta
    .sort(sortFunction)
    .map(track => {
      return track.id;
    });

  return trackIds;
}

export async function POST(req: NextRequest) {
  // Auth request with clerk
  if (!isMinister()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const filter = (await req.json()) as FilterPacket;

  if (!filter || !filter.sorting || !validTrackSortingFunctions.includes(filter.sorting.sortBy) || !filter.users || !filter.genres || !filter.artists || !filter.albums) {
    return NextResponse.json({ error: "Invalid filter packet" }, { status: 400 });
  }

  return NextResponse.json({ trackIds: await getIdsFromFilter(filter) }, { status: 200 });
}