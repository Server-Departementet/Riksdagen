import type { TrackStats } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sha1 } from "@/lib/hash";
import filterTracks from "../lib/filter";

export const dynamic = "force-dynamic";

const cache: Record<string, Record<string, TrackStats>> = {};
// Clear cache every day at 3 AM
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 3) {
    console.info("Clearing track stats cache");
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}, 60 * 1000);

export async function POST(req: NextRequest): Promise<NextResponse<{ trackStats: Record<string, TrackStats> }>> {
  // Auth user 
  if (!isMinister()) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body;

  const filterHash = sha1(JSON.stringify(filter));
  if (cache[filterHash]) {
    return NextResponse.json({ trackStats: cache[filterHash] });
  }

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

  const tracksWithStats = await filterTracks(trackDataWithPlays, filter);

  const trackStats: Record<string, TrackStats> = {};
  tracksWithStats.forEach((track) => {
    const trackHash = sha1(track.id + sha1(JSON.stringify(filter)))
    trackStats[trackHash] = {
      totalMS: track.totalMS,
      totalPlays: track.totalPlays,
      playsPerUser: track.playsPerUser,
      trackId: track.id,
    }
  });

  // Cache the track stats
  cache[filterHash] = trackStats;

  return NextResponse.json({ trackStats });
}