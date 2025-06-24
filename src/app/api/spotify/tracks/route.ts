import type { FetchFilterPacket, TrackStats, TrackWithPlays, FilterHash } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import filterTracks from "@/app/api/spotify/lib/filter";
import { encodeTrackData, encodeTrackIndex, encodeTrackStats } from "@/lib/spotify.proto";
import { sha1 } from "@/lib/hash";

export const dynamic = "force-dynamic";

const statsCache: Record<FilterHash, Uint8Array> = {};
const dataCache: Record<FilterHash, Uint8Array> = {};
const indexCache: Record<FilterHash, Uint8Array> = {};
// Clear cache on interval
setInterval(() => {
  console.info("Clearing cache");
  Object.keys(statsCache).forEach(key => delete statsCache[key]);
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
  Object.keys(indexCache).forEach(key => delete indexCache[key]);
}, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body as { filter: FetchFilterPacket };
  const params = req.nextUrl.searchParams;
  const requestType = params.get("type");

  if (!requestType || !["index", "data", "stats"].includes(requestType)) {
    console.warn("Received track data request without request type parameter");
    return new NextResponse("Bad Request. Missing request type. (type=index|data|stats)", { status: 400 });
  }

  const filterHash = sha1(JSON.stringify(filter));

  if (requestType === "index" && indexCache[filterHash]) {
    return NextResponse.json({ index: indexCache[filterHash] });
  }
  else if (requestType === "data" && dataCache[filterHash]) {
    return NextResponse.json({ trackData: dataCache[filterHash] });
  }
  else if (requestType === "stats" && statsCache[filterHash]) {
    return NextResponse.json({ trackStats: statsCache[filterHash] });
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

  const trackData = await filterTracks(tracks, filter);

  if (requestType === "index") {
    const index = encodeTrackIndex(trackData.map(track => track.id), filter);
    indexCache[filterHash] = index;
    return NextResponse.json({ index });
  }
  else if (requestType === "data") {
    const strippedTracks = trackData.map(track => {
      // @ts-expect-error - "Casting" to match the Track type
      delete track.totalMS; delete track.totalPlays; delete track.playsPerUser; delete track.trackId;
      return track;
    });
    const encodedTrackData = encodeTrackData(strippedTracks);
    dataCache[filterHash] = encodedTrackData;
    return NextResponse.json({ trackData: encodedTrackData });
  }
  else if (requestType === "stats") {
    const stats: TrackStats[] = trackData.map(t => ({
      totalMS: t.totalMS,
      totalPlays: t.totalPlays,
      trackId: t.id,
      playsPerUser: t.playsPerUser
    }));
    const encodedTrackStats = encodeTrackStats(stats, filter);
    statsCache[filterHash] = encodedTrackStats;
    return NextResponse.json({ trackStats: encodedTrackStats });
  }

  return new NextResponse("Missing request type", { status: 400 });
}
