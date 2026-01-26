import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { FilterPanel } from "@/components/spotify/filter-panel";
import { TrackList } from "@/components/spotify/track";
import { Track } from "@/prisma/generated";
import { getSortedTrackISRCs } from "@/functions/spotify/get-sorted-track-isrcs";
import {
  DEFAULT_SPOTIFY_SORT_DIRECTION,
  DEFAULT_SPOTIFY_SORT_VALUE,
  isSpotifySortValue,
  SpotifySortDirection,
  SpotifySortValue,
} from "@/lib/spotify-sort";

type FilterParams = {
  users?: string; // Comma-separated user IDs
  q?: string; // Search query
  sort?: string;
  dir?: string;
};

export default async function SpotifyPage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  const {
    users: paramUsers,
    q: paramQuery,
    sort: paramSort,
    dir: paramDirection,
  } = await searchParams;

  const sortValue: SpotifySortValue = isSpotifySortValue(paramSort)
    ? paramSort
    : DEFAULT_SPOTIFY_SORT_VALUE;
  const sortDirection: SpotifySortDirection = typeof paramDirection === "string" && paramDirection.toLowerCase() === "asc"
    ? "asc"
    : DEFAULT_SPOTIFY_SORT_DIRECTION;

  const users = await getUsers(paramQuery);
  const hasUserParam = (
    typeof paramUsers !== "undefined"
    && paramUsers.trim() !== ""
    && paramUsers.split(",").length > 0
  );
  const validUsersInParam = hasUserParam
    ? paramUsers.split(",").filter(uId => users.some(u => u.id === uId))
    : [];
  const selectedUsers = hasUserParam
    ? users.filter(u => validUsersInParam.includes(u.id))
    : users;
  const sortedTrackISRCs = await getSortedTrackISRCs({
    userIds: selectedUsers.map(u => u.id),
    trackSearchQuery: paramQuery,
    sortOption: sortValue,
    sortDirection,
  });

  return <main
    className={`
      flex flex-col items-center justify-center
      lg:flex-row lg:items-start

      gap-y-6
      lg:gap-x-6

      px-0
    `}
  >
    <aside className="px-4 flex flex-col gap-y-5">
      <h1 className="mt-4">
        Spotify-statistik
      </h1>

      <FilterPanel
        users={users.map(u => ({ id: u.id, name: u.name }))}
        selectedUsers={selectedUsers.map(u => ({ id: u.id, name: u.name }))}
        query={paramQuery}
        sortValue={sortValue}
        sortDirection={sortDirection}
      />
    </aside>

    <hr className="lg:hidden w-11/12" />

    <section className="lg:pt-4 pb-16 lg:h-(--screen-height) w-fit">
      <TrackList
        trackISRCs={sortedTrackISRCs}
        filterUserIds={selectedUsers.map(u => u.id)}
      />
    </section>
  </main>;
}

async function getUsers(trackSearchQuery?: string): Promise<{
  id: string;
  name: string | null;
  trackPlays: Record<Track["ISRC"], number>;
}[]> {
  "use cache";
  return (await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      trackPlays: {
        select: { trackId: true, track: { select: { ISRC: true, } } },
        where: {
          OR: [
            {
              track: { name: { contains: trackSearchQuery ?? "", }, },
            },
            {
              track: { album: { name: { contains: trackSearchQuery ?? "", }, }, },
            },
            {
              track: { artists: { some: { name: { contains: trackSearchQuery ?? "", }, }, }, },
            },
            {
              trackId: trackSearchQuery,
            },
            {
              track: { ISRC: trackSearchQuery },
            },
          ],
        },
      },
    },
    where: {
      trackPlays: { some: {} },
    },
    orderBy: { trackPlays: { _count: "desc" } },
  }))
    .map(user => ({
      id: user.id,
      name: user.name,
      trackPlays: user.trackPlays.reduce((acc, tp) => {
        const isrc = tp.track?.ISRC;
        if (!isrc) return acc;
        acc[isrc] = (acc[isrc] ?? 0) + 1;
        return acc;
      }, {} as Record<Track["ISRC"], number>),
    }));
}