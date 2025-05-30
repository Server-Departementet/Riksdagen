import type { FilterPacket } from "@/app/spotify/types";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { compileTrackWithMeta } from "@/app/api/spotify/lib/tracks";
import { extractFilter, filterTracks, sortTracks } from "@/app/api/spotify/lib/filter";
// import { isMinister } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getTrackData(trackIds: string[], filter: FilterPacket) {
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

  const { filteredTracks, filteredTrackPlays } = filterTracks(dbTracks, dbTrackPlays, filter);

  // Compile tracks with metadata
  return sortTracks(await Promise.all(
    filteredTracks.map(track => compileTrackWithMeta(track, filteredTrackPlays))
  ), filter);
}

export async function POST(req: NextRequest) {
  // TODO - Reimplement with request buffering
  // // Auth request with clerk
  // if (!isMinister()) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // }

  const url = new URL(req.url);
  const params = url.searchParams;

  const trackIds = params.get("ids")?.split(",") || [];

  const filter = await extractFilter(req);
  if (!filter || !trackIds.length) {
    return NextResponse.json({ error: "Invalid filter or no tracks provided" }, { status: 400 });
  }

  const trackData = await getTrackData(trackIds, filter);

  return NextResponse.json({ tracks: trackData }, { status: 200 });
}