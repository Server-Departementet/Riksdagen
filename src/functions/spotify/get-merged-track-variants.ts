"use server";

import { prisma } from "@/lib/prisma";
import { TrackWithCompany } from "@/types";

const sortTracksByRelevance = (a: TrackWithCompany, b: TrackWithCompany) => {
  const playDiff = b._count.TrackPlays - a._count.TrackPlays;
  if (playDiff !== 0) return playDiff;

  const releaseDiff = (b.album.releaseDate?.getTime() ?? 0) - (a.album.releaseDate?.getTime() ?? 0);
  if (releaseDiff !== 0) return releaseDiff;

  return a.id.localeCompare(b.id);
};

export async function getMergedTrackVariants(ISRC: string): Promise<TrackWithCompany[]> {
  const trimmedISRC = ISRC?.trim();
  if (!trimmedISRC) return [];

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
  const mergedVariantCount = variants.length;

  return variants
    .map(variant => ({
      ...variant,
      mergedVariantCount,
    }))
    .sort(sortTracksByRelevance);
}
