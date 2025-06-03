import type { Track } from "@/app/spotify/types";
import { NextResponse, type NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter } = body;

  const tracks = await prisma.track.findMany({
    orderBy: {
      TrackPlay: { _count: 'desc' },
    },
    include: {
      artists: true,
      album: true,
    }
  });

  // Add color
  const trackData: Track[] = await Promise.all(tracks.map(async (track) => ({
    ...track,
    color: await getTrackBGColor(track.image || ""),
  })));


  return NextResponse.json({ trackData });
}