"use server";

import { prisma } from "@/lib/prisma";
import { TrackWithCompany } from "@/types";
import { TrackDataFilters } from "./get-track-data";

const sortTracksByRelevance = (a: TrackWithCompany, b: TrackWithCompany) => {
  const playDiff = b._count.TrackPlays - a._count.TrackPlays;
  if (playDiff !== 0) return playDiff;

  const releaseDiff = (b.album.releaseDate?.getTime() ?? 0) - (a.album.releaseDate?.getTime() ?? 0);
  if (releaseDiff !== 0) return releaseDiff;

  return a.id.localeCompare(b.id);
};

export async function getMergedTrackVariants(ISRC: string, filters?: TrackDataFilters): Promise<TrackWithCompany[]> {
  const trimmedISRC = ISRC?.trim();
  if (!trimmedISRC) return [];

  const filteredUserIds = (filters?.userIds ?? []).filter(Boolean);
  const shouldFilterTrackPlays = filteredUserIds.length > 0;

  const tracks = await prisma.track.findMany({
    where: { ISRC: trimmedISRC },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          url: true,
          image: true,
          color: true,
          releaseDate: true,
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

  const variants = tracks as TrackWithCompany[];

  let variantsWithCounts = variants;
  if (shouldFilterTrackPlays && variants.length > 0) {
    const trackIds = variants.map(track => track.id);
    const filteredCounts = await prisma.trackPlay.groupBy({
      by: ["trackId"],
      _count: { trackId: true },
      where: {
        trackId: { in: trackIds },
        userId: { in: filteredUserIds },
      },
    });
    const countMap = new Map(filteredCounts.map(count => [count.trackId, count._count.trackId]));
    variantsWithCounts = variants.map(track => ({
      ...track,
      _count: {
        TrackPlays: countMap.get(track.id) ?? 0,
      },
    }));
  }

  const mergedVariantCount = variantsWithCounts.length;

  return variantsWithCounts
    .map(variant => ({
      ...variant,
      mergedVariantCount,
    }))
    .sort(sortTracksByRelevance);
}
