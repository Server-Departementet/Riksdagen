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

export async function getTrackDataBatch(trackIds: string[]) {
  "use cache";
  return prisma.track.findMany({
    where: { id: { in: trackIds, }, },
    include: {
      album: true,
      artists: true,
      _count: { select: { TrackPlays: true, }, },
    },
  });
}