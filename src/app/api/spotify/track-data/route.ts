import type { FetchFilterPacket, TrackWithPlays, TrackWithStats } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import filterTracks from "@/app/api/spotify/lib/filter";
import { sha1 } from "@/lib/hash";

export const dynamic = "force-dynamic";

const cache: Record<string, TrackWithStats[]> = {};
// Clear cache every day at 3 AM
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 3) {
    console.info("Clearing track data cache");
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}, 60 * 1000);

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body as { filter: FetchFilterPacket };

  const filterHash = sha1(JSON.stringify(filter));
  if (cache[filterHash]) {
    // Return cached data if available
    return NextResponse.json({ trackData: cache[filterHash] });
  }

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

  // Cache the filtered track data
  cache[filterHash] = trackData;

  return NextResponse.json({ trackData });
}