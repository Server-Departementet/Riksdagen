"use server";

import { prisma } from "@/lib/prisma";
import { TrackWithCompany } from "@/types";

export async function getTrackDataBatch(trackIds: string[]): Promise<TrackWithCompany[]> {
  "use cache";

  const uniqueTrackIds = Array.from(new Set(trackIds.filter(Boolean)));
  if (uniqueTrackIds.length === 0) return [];

  const tracks = await prisma.track.findMany({
    where: { id: { in: uniqueTrackIds } },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          url: true,
          image: true,
          color: true,
        },
      },
      artists: {
        select: {
          id: true,
          name: true,
          url: true,
          image: true,
          color: true,
        },
      },
      _count: {
        select: { TrackPlays: true },
      },
    },
  });

  const trackWithRelations = tracks as TrackWithCompany[];
  const trackById = new Map<string, TrackWithCompany>(
    trackWithRelations.map(track => [track.id, track]),
  );

  return uniqueTrackIds
    .map(trackId => trackById.get(trackId))
    .filter((track): track is TrackWithCompany => Boolean(track));
}