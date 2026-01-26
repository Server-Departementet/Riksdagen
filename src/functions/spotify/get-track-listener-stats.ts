"use server";

import { prisma } from "@/lib/prisma";

export type TrackListenerStatsOptions = {
  userIds?: string[];
};

export type TrackListenerStat = {
  userId: string;
  userName: string | null;
  listenCount: number;
  listenTimeMs: number;
};

export async function getTrackListenerStats(ISRC: string, options?: TrackListenerStatsOptions): Promise<TrackListenerStat[]> {
  "use cache";

  const trimmedISRC = ISRC?.trim();
  if (!trimmedISRC) return [];

  const trackVariants = await prisma.track.findMany({
    where: { ISRC: trimmedISRC },
    select: {
      id: true,
      duration: true,
    },
  });

  if (trackVariants.length === 0) return [];

  const trackIds = trackVariants.map(track => track.id);
  const trackDurationMap = new Map(trackVariants.map(track => [track.id, track.duration]));

  const filteredUserIds = (options?.userIds ?? []).filter(Boolean);
  const trackPlayGroups = await prisma.trackPlay.groupBy({
    by: ["userId", "trackId"],
    _count: { trackId: true },
    where: {
      trackId: { in: trackIds },
      ...(filteredUserIds.length > 0 ? { userId: { in: filteredUserIds } } : {}),
    },
  });

  if (trackPlayGroups.length === 0) return [];

  const aggregates = new Map<string, { listenCount: number; listenTimeMs: number }>();

  for (const group of trackPlayGroups) {
    const duration = trackDurationMap.get(group.trackId) ?? 0;
    const listenTimeMs = group._count.trackId * duration;
    const current = aggregates.get(group.userId) ?? { listenCount: 0, listenTimeMs: 0 };
    current.listenCount += group._count.trackId;
    current.listenTimeMs += listenTimeMs;
    aggregates.set(group.userId, current);
  }

  const userIds = Array.from(aggregates.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userNameMap = new Map(users.map(user => [user.id, user.name]));

  const stats: TrackListenerStat[] = Array.from(aggregates.entries()).map(([userId, data]) => ({
    userId,
    userName: userNameMap.get(userId) ?? null,
    listenCount: data.listenCount,
    listenTimeMs: data.listenTimeMs,
  }));

  stats.sort((a, b) => {
    if (b.listenCount !== a.listenCount) {
      return b.listenCount - a.listenCount;
    }
    if (b.listenTimeMs !== a.listenTimeMs) {
      return b.listenTimeMs - a.listenTimeMs;
    }
    const aLabel = a.userName ?? a.userId;
    const bLabel = b.userName ?? b.userId;
    return aLabel.localeCompare(bLabel, "sv");
  });

  return stats;
}
