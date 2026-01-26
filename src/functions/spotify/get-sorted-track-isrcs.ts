"use server";

import { prisma } from "@/lib/prisma";
import { buildTrackSearchWhere } from "@/lib/track-search";
import { SpotifySortDirection, SpotifySortValue } from "@/lib/spotify-sort";

export type GetSortedTrackISRCsOptions = {
  userIds: string[];
  trackSearchQuery?: string;
  sortOption: SpotifySortValue;
  sortDirection: SpotifySortDirection;
};

export async function getSortedTrackISRCs({
  userIds,
  trackSearchQuery,
  sortOption,
  sortDirection,
}: GetSortedTrackISRCsOptions): Promise<string[]> {
  "use cache";

  const filteredUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (filteredUserIds.length === 0) {
    return [];
  }

  const searchWhere = buildTrackSearchWhere(trackSearchQuery);
  const trackPlayWhere = {
    userId: { in: filteredUserIds },
    ...(searchWhere ?? {}),
  };

  const groupedTrackPlays = await prisma.trackPlay.groupBy({
    by: ["trackId"],
    _count: { trackId: true },
    where: trackPlayWhere,
  });

  if (groupedTrackPlays.length === 0) {
    return [];
  }

  const trackIds = groupedTrackPlays.map(entry => entry.trackId);
  const trackRecords = await prisma.track.findMany({
    where: { id: { in: trackIds } },
    select: {
      id: true,
      ISRC: true,
      name: true,
      duration: true,
      album: { select: { releaseDate: true } },
      artists: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });

  const trackById = new Map(trackRecords.map(track => [track.id, track]));

  type VariantRecord = {
    track: typeof trackRecords[number];
    playCount: number;
  };

  const aggregates = new Map<string, {
    variants: VariantRecord[];
    totalCount: number;
    totalListenTimeMs: number;
  }>();

  for (const grouped of groupedTrackPlays) {
    const track = trackById.get(grouped.trackId);
    if (!track) continue;

    const playCount = grouped._count.trackId;
    const isrc = track.ISRC;

    if (!aggregates.has(isrc)) {
      aggregates.set(isrc, {
        variants: [],
        totalCount: 0,
        totalListenTimeMs: 0,
      });
    }

    const record = aggregates.get(isrc)!;
    record.totalCount += playCount;
    record.totalListenTimeMs += playCount * track.duration;
    record.variants.push({ track, playCount });
  }

  if (aggregates.size === 0) {
    return [];
  }

  const directionMultiplier = sortDirection === "asc" ? 1 : -1;
  const collator = new Intl.Collator("sv-SE", { sensitivity: "base" });

  const sortable = Array.from(aggregates.entries()).map(([isrc, aggregate]) => {
    const canonicalVariant = aggregate.variants
      .slice()
      .sort((a, b) => {
        const playDiff = b.playCount - a.playCount;
        if (playDiff !== 0) return playDiff;
        const releaseDiff = (b.track.album?.releaseDate?.getTime() ?? 0) - (a.track.album?.releaseDate?.getTime() ?? 0);
        if (releaseDiff !== 0) return releaseDiff;
        return a.track.id.localeCompare(b.track.id);
      })[0];

    const canonicalTrack = canonicalVariant.track;

    return {
      isrc,
      listenCount: aggregate.totalCount,
      listenTimeMs: aggregate.totalListenTimeMs,
      trackLength: canonicalTrack.duration,
      artistName: canonicalTrack.artists[0]?.name ?? "",
      trackName: canonicalTrack.name,
      tieBreakerId: canonicalTrack.id,
    };
  });

  sortable.sort((a, b) => {
    let comparison = 0;
    switch (sortOption) {
      case "listen-count":
        comparison = a.listenCount - b.listenCount;
        break;
      case "listen-time":
        comparison = a.listenTimeMs - b.listenTimeMs;
        break;
      case "track-length":
        comparison = a.trackLength - b.trackLength;
        break;
      case "artist-name":
        comparison = collator.compare(a.artistName, b.artistName);
        break;
      case "track-name":
        comparison = collator.compare(a.trackName, b.trackName);
        break;
      default:
        comparison = 0;
    }

    if (comparison !== 0) {
      return comparison * directionMultiplier;
    }

    const secondary = collator.compare(a.trackName, b.trackName);
    if (secondary !== 0) {
      return secondary;
    }

    return a.tieBreakerId.localeCompare(b.tieBreakerId);
  });

  return sortable.map(entry => entry.isrc);
}
