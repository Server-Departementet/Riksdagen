import { cacheLife } from "next/cache";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/prisma";
import { FilterPanel } from "@/components/spotify/filter-panel";
import { ImportPanel } from "@/components/spotify/import-panel";
import { TrackList } from "@/components/spotify/track";
import { getSortedTrackISRCs } from "@/functions/spotify/get-sorted-track-isrcs";
import type {
  SpotifySortDirection,
  SpotifySortValue,
} from "@/lib/spotify-sort";
import {
  DEFAULT_SPOTIFY_SORT_DIRECTION,
  DEFAULT_SPOTIFY_SORT_VALUE,
  isSpotifySortValue,
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
  const session = await auth();
  if (session?.role !== "minister") return notFound();

  const spotifyConnected = !!(await prisma.spotifyAccount.findUnique({
    where: { userId: session.userId },
    select: { userId: true },
  }));

  const params = await searchParams;
  const {
    users: paramUsers,
    q: paramQuery,
    sort: paramSort,
    dir: paramDirection,
  } = params;

  const sortValue: SpotifySortValue = isSpotifySortValue(paramSort)
    ? paramSort
    : DEFAULT_SPOTIFY_SORT_VALUE;
  const sortDirection: SpotifySortDirection = typeof paramDirection === "string" && paramDirection.toLowerCase() === "asc"
    ? "asc"
    : DEFAULT_SPOTIFY_SORT_DIRECTION;

  const users = await getUsers();
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

      <a href="/spotify/log" className="global w-fit -mt-3">
        Hämtningslogg
      </a>

      {!spotifyConnected && (
        <a
          href="/api/auth/spotify"
          className="w-fit px-4 py-2 bg-[#1db954] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg"
        >
          Koppla ditt Spotify-konto
        </a>
      )}

      {/* Keyed on the URL so a soft navigation remounts the panel with the
          server-normalised selection (unknown users dropped, defaulted sort) */}
      <FilterPanel
        key={JSON.stringify(params)}
        users={users.map(u => ({ id: u.id, name: u.name }))}
        selectedUsers={selectedUsers.map(u => ({ id: u.id, name: u.name }))}
        query={paramQuery}
        sortValue={sortValue}
        sortDirection={sortDirection}
      />

      <ImportPanel />
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

/** Every user with at least one play, most plays first. Only the identity is needed: the track list fetches its own stats. */
async function getUsers(): Promise<{ id: string; name: string | null }[]> {
  "use cache";
  cacheLife("minutes"); // Stats shift constantly (imports, 15-min fetches); the default 15-min revalidation made independently cached pieces disagree
  return await prisma.user.findMany({
    select: { id: true, name: true },
    where: { trackPlays: { some: {} } },
    orderBy: { trackPlays: { _count: "desc" } },
  });
}
