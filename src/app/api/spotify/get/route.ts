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

  const trackIds = params.get("trackIds")?.split(",") || [];

  // Read DB
  const tracks = await prisma.track.findMany({
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

  return NextResponse.json({ tracks: JSON.stringify(tracks) }, { status: 200 });
}