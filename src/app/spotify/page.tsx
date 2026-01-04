import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { FilterPanel } from "@/components/spotify/filter-panel";
import { TrackList } from "@/components/spotify/track";
import { Track } from "@/prisma/generated";

type FilterParams = {
  users?: string; // Comma-separated user IDs
  q?: string; // Search query
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
  } = await searchParams;

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
      />
    </aside>

    <hr className="lg:hidden w-11/12" />

    <section className="lg:pt-4 pb-16 lg:h-(--screen-height) w-fit">
      <TrackList
        trackIds={[...new Set(selectedUsers.flatMap(u =>
          Object.entries(u.trackPlays)
            .sort((a, b) => b[1] - a[1])
            .map(([trackId]) => trackId)
        ))]}
      />
    </section>
  </main>;
}

async function getUsers(searchQuery?: string): Promise<{ id: string; name: string | null; trackPlays: Record<Track["id"], number>; }[]> {
  "use cache";
  return (await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      trackPlays: {
        select: { trackId: true },
        where: {
          track: {
            name: {
              contains: searchQuery ?? "",
            }
          },
        },
      },
    },
    orderBy: { trackPlays: { _count: "desc" } },
  }))
    .map(user => ({
      id: user.id,
      name: user.name,
      trackPlays: user.trackPlays.reduce((acc, tp) => {
        {
          acc[tp.trackId] = (acc[tp.trackId] ?? 0) + 1;
          return acc;
        }
      }, {} as Record<Track["id"], number>),
    }));
}