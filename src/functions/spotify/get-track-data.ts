"use server";

import { prisma } from "@/lib/prisma";
import { TrackWithCompany } from "@/types";

export async function getTrackDataBatch(ISRCs: string[]): Promise<TrackWithCompany[]> {
  "use cache";

  const uniqueISRCs = Array.from(new Set(ISRCs.filter(Boolean)));
  if (uniqueISRCs.length === 0) return [];

  const tracks = await prisma.track.findMany({
    where: { ISRC: { in: uniqueISRCs } },
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

  const tracksWithRelations = tracks as TrackWithCompany[];
  const tracksByISRC = new Map<string, TrackWithCompany[]>();

  for (const track of tracksWithRelations) {
    const current = tracksByISRC.get(track.ISRC) ?? [];
    current.push(track);
    tracksByISRC.set(track.ISRC, current);
  }

  const mergedTracks = new Map<string, TrackWithCompany>();

  for (const [isrc, candidates] of tracksByISRC.entries()) {
    if (candidates.length === 0) continue;

    const totalTrackPlays = candidates.reduce((sum, candidate) => sum + candidate._count.TrackPlays, 0);
    const mergedVariantCount = candidates.length;

    const canonicalTrack = candidates
      .slice()
      .sort((a, b) => {
        const playDiff = b._count.TrackPlays - a._count.TrackPlays;
        if (playDiff !== 0) return playDiff;

        const releaseDiff = (b.album.releaseDate?.getTime() ?? 0) - (a.album.releaseDate?.getTime() ?? 0);
        if (releaseDiff !== 0) return releaseDiff;

        return a.id.localeCompare(b.id);
      })[0];

    mergedTracks.set(isrc, {
      ...canonicalTrack,
      _count: { TrackPlays: totalTrackPlays },
      mergedVariantCount,
    });
  }

  return uniqueISRCs
    .map(isrc => mergedTracks.get(isrc))
    .filter((track): track is TrackWithCompany => Boolean(track));
}