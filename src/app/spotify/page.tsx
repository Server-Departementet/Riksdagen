import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import TrackElement from "@/components/spotify/track";
import { Button } from "@/components/ui/button";
import { Album, Artist, Track } from "@/prisma/generated";

type FilterParams = {
  users?: string; // Comma-separated user IDs
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

  return <main>
    <h1 className="mt-4">
      Spotify-statistik
    </h1>

    <aside>
      <h2>Filter</h2>

      {users.map(u => (
        <Button
          key={"filter-" + u.id}
          variant={"outline"}
        >
          {u.name}
        </Button>
      ))}
    </aside>

    <section className="min-w-1/2">
      <p className="w-full text-center text-sm">NNNN Resultat XXXX ms</p>

      <ul className="*:mb-3">
        {tracks.map((track, i) => {
          const album = albums.find(a => a.id === track.albumId);
          if (!album) throw new Error(`Album with ID ${track.albumId} not found for track ${track.id}`);

          const trackArtists = track.artists
            .map(trackArtist => artists.find(artist => artist.id === trackArtist.id))
            .filter(artist => typeof artist !== "undefined");

          const trackPlays = selectedUsers.reduce((acc, user) => {
            const plays = user.trackPlays[track.id] ?? 0;
            return acc + plays;
          }, 0);

          return (
            <TrackElement
              key={`track-${track.id}`}
              track={track}
              artists={trackArtists}
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