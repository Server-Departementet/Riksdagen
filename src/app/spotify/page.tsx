import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import TrackElement from "@/components/spotify/track";
import { Album, Artist, Track } from "@/prisma/generated";
import { FilterPanel } from "@/components/spotify/filter-panel";

type FilterParams = {
  users?: string; // Comma-separated user IDs
};

export default async function SpotifyPage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  // eslint-disable-next-line react-hooks/purity
  const startTime = performance.now();

  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  const {
    users: paramUsers,
  } = await searchParams;

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

  // TODO: try getting only track ids first and then parallell fetch tracks, albums and artists
  const tracks = await getTracks(selectedUsers);
  const [
    albums,
    artists,
  ] = await Promise.all([
    getAlbums(tracks),
    getArtists(tracks),
  ]);

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
      />
    </aside>

    <hr className="lg:hidden w-11/12" />

    <section className="lg:pt-4 pb-16 lg:h-(--screen-height)">
      <p
        className={`
          w-full text-sm 
          text-gray-600
          px-4 mb-1

          text-center 
          lg:text-start
        `}
      >
        {tracks.length} Resultat&nbsp;&nbsp;&middot;&nbsp;&nbsp;{(
          // eslint-disable-next-line react-hooks/purity
          performance.now() - startTime).toFixed(0)
        } ms
      </p>

      <ul className="*:mb-3 px-4 h-full overflow-y-auto">
        {tracks
          .map(track => {
            const album = albums.find(a => a.id === track.albumId);
            if (!album) throw new Error(`Album with ID ${track.albumId} not found for track ${track.id}`);

            const trackArtists = track.artists
              .map(trackArtist => artists.find(artist => artist.id === trackArtist.id))
              .filter(artist => typeof artist !== "undefined");

            const trackPlays = selectedUsers.reduce((acc, user) => {
              const plays = user.trackPlays[track.id] ?? 0;
              return acc + plays;
            }, 0);

            return {
              track,
              album,
              artists: trackArtists,
              trackPlays,
            };
          })
          .sort((a, b) => b.trackPlays - a.trackPlays)
          .map(({ track, album, artists, trackPlays }, i) => {
            return (
              <TrackElement
                key={`track-${track.id}`}
                track={track}
                artists={artists}
                album={album}
                trackPlays={trackPlays}
                lineNumber={i + 1}
              />
            );
          })}
      </ul>
    </section>
  </main>;
}

async function getUsers(): Promise<{ id: string; name: string | null; trackPlays: Record<Track["id"], number>; }[]> {
  "use cache";
  return (await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      trackPlays: { select: { trackId: true }, },
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

async function getTracks(users: { id: string }[]): Promise<(Track & { artists: { id: string; }[]; album: { id: string; }; })[]> {
  "use cache";
  return prisma.track.findMany({
    take: 100,
    where: {
      TrackPlays: {
        some: {
          userId: { in: users.map(u => u.id), },
        },
      },
    },
    orderBy: { TrackPlays: { _count: "desc" } },
    include: {
      artists: { select: { id: true }, },
      album: { select: { id: true }, },
    },
  });
}

async function getAlbums(tracks: { id: string }[]): Promise<Album[]> {
  "use cache";
  return prisma.album.findMany({
    where: {
      tracks: {
        some: {
          id: { in: tracks.map(t => t.id), },
        },
      },
    },
  });
}

async function getArtists(tracks: { id: string }[]): Promise<Artist[]> {
  "use cache";
  return prisma.artist.findMany({
    where: {
      tracks: {
        some: {
          id: { in: tracks.map(t => t.id), },
        },
      },
    },
  });
}