import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import TrackElement from "@/components/spotify/track";
import { Button } from "@/components/ui/button";
import { Album, Artist, Track, User } from "@/prisma/generated";

export default async function SpotifyPage() {
  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  const [
    users,
    tracks,
    artists,
    albums,
  ] = await Promise.all([
    getUsers(),
    getTracks(),
    getArtists(),
    getAlbums(),
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
          const trackArtists = track.artists
            .map(trackArtist => artists.find(artist => artist.id === trackArtist.id))
            .filter(artist => typeof artist !== "undefined");
          const album = albums.find(a => a.id === track.albumId);
          if (!album) throw new Error(`Album with ID ${track.albumId} not found for track ${track.id}`);

          return (
            <TrackElement
              key={`track-${track.id}`}
              track={track}
              artists={trackArtists}
              album={album}
              lineNumber={i + 1}
            />
          );
        })}
      </ul>
    </section>
  </main>;
}

async function getUsers(): Promise<User[]> {
  "use cache";
  return prisma.user.findMany();
}

async function getTracks(): Promise<(Track & { album: { id: string }; artists: { id: string }[]; })[]> {
  "use cache";
  return prisma.track.findMany({
    where: { TrackPlays: { some: {}, }, },
    orderBy: { TrackPlays: { _count: "desc" } },
    include: {
      album: { select: { id: true, }, },
      artists: { select: { id: true, }, },
    },
    take: 100,
  });
}

async function getArtists(): Promise<Artist[]> {
  "use cache";
  return prisma.artist.findMany({
    where: { tracks: { some: {}, }, },
  });
}

async function getAlbums(): Promise<Album[]> {
  "use cache";
  return prisma.album.findMany({
    where: { tracks: { some: {}, }, },
  });
}