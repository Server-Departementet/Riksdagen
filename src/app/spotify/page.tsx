import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import TrackElement from "@/components/spotify/track";
import { Button } from "@/components/ui/button";

export default async function SpotifyPage() {
  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  const [
    users,
    tracks,
  ] = await Promise.all([
    getUsers(),
    getTracks(),
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

    <section className="w-1/2">
      <p>NNNN Resultat XXXX ms</p>

      <ul>
        {tracks.map((track, i) => (
          <TrackElement
            key={`track-${track.id}`}
            trackData={track}
            lineNumber={i + 1}
          />
        ))}
      </ul>
    </section>
  </main>;
}

async function getUsers() {
  "use cache";
  return prisma.user.findMany();
}

async function getTracks() {
  // "use cache";
  return prisma.track.findMany({
    where: { TrackPlays: { some: {}, }, },
    orderBy: { TrackPlays: { _count: "desc" } },
    include: {
      album: true,
      artists: true,
    },
  });
}