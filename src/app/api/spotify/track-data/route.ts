import type { FetchFilterPacket, TrackWithPlays, TrackWithStats } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import filterTracks from "@/app/api/spotify/lib/filter";

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body as { filter: FetchFilterPacket };

  const tracks: TrackWithPlays[] = await prisma.track.findMany({
    orderBy: {
      TrackPlay: { _count: 'desc' },
    },
    include: {
      artists: true,
      album: true,
      TrackPlay: true,
    }
  });

  const filteredTracks = await filterTracks(tracks, filter);

  // Add color
  const trackData: TrackWithStats[] = await Promise.all(filteredTracks.map(async (track) => ({
    ...track,
    color: await getTrackBGColor(track.image || ""),
  })));

  return NextResponse.json({ trackData });
}