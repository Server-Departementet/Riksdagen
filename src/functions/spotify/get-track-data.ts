"use server";

import { prisma } from "@/lib/prisma";

export async function getTrackData(trackId: string) {
  "use cache";
  return prisma.track.findUnique({
    where: { id: trackId },
    include: {
      album: true,
      artists: true,
      _count: { select: { TrackPlays: true, }, },
    },
  });
}