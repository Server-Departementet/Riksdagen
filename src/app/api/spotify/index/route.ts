import type { FilterPacket, TrackWithMeta } from "@/app/spotify/types";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { compileTrackWithMeta } from "@/app/api/spotify/lib/tracks";
import { isMinister } from "@/lib/auth";
import { extractFilter, filterTracks, sortTracks } from "@/app/api/spotify/lib/filter";

export const dynamic = "force-dynamic";

async function getIdsFromFilter(filter: FilterPacket) {
  // "use cache";

  const allTracks = await prisma.track.findMany({
    include: {
      album: true,
      artists: true,
    },
  });
  const allTrackPlays = (await prisma.trackPlay.findMany({
    include: {
      track: {
        include: {
          album: true,
          artists: true,
        },
      },
    },
  }));

  const { filteredTracks, filteredTrackPlays } = filterTracks(allTracks, allTrackPlays, filter);

  const allTracksWithMeta: TrackWithMeta[] = await Promise.all(
    filteredTracks.map(async (track) => compileTrackWithMeta(track, filteredTrackPlays))
  );

  const sortedTracks = sortTracks(allTracksWithMeta, filter);

  const trackIds = sortedTracks.map(track => track.id);
  const trackSearchTerm = sortedTracks.map(track => track.name);

  return { trackIds, trackSearchTerm };
}

export async function POST(req: NextRequest) {
  // Auth request with clerk
  if (!isMinister()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const filter = await extractFilter(req);
  if (!filter) {
    return NextResponse.json({ error: "Invalid filter" }, { status: 400 });
  }

  const { trackIds, trackSearchTerm } = await getIdsFromFilter(filter);

  return NextResponse.json({ trackIds, trackSearchTerm }, { status: 200 });
}