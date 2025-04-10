
// import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { TrackPlay } from "@/components/spotify/track-play";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

const client = clerkClient();

async function getUserData(userId: string) {
  return await prisma.trackPlay.findMany({
    where: {
      userId: userId,
    },
    include: {
      track: true,
    },
  });
}

export default async function SpotifyPage() {
  const users = (await (await client).users.getUserList()).data
    .filter(user => user.publicMetadata.role === "minister")
    .map(user => ({ name: user.firstName, id: user.id, data: getUserData(user.id) }))
    .reverse();

  return (
    <main>
      <h1 className="mt-10">Spotify Statistik</h1>

      <Tabs className="mt-5 w-10/12" defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all">
            Totalt
          </TabsTrigger>

          {users.map(async user => (
            <TabsTrigger key={user.id} value={user.id}>
              {user.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          Lyssningstid:
          {
            users.map(async (user, i) => {
              const data = await user.data;
              const totalTime = data.reduce((acc, play) => acc + play.track.duration, 0) / 1000;
              return (
                <div key={user.id + "-" + i} className="font-normal">
                  <span className="font-bold">{user.name}</span>: {totalTime} s / {Math.floor(totalTime / 60)} min / {Math.floor(totalTime / 3600)} h / {Math.floor(totalTime / 86400)} d / {Math.floor(totalTime / 604800)} w / {Math.floor(totalTime / 2419200)} m / {Math.floor(totalTime / 29030400)} y
                </div>
              );
            })
          }
        </TabsContent>

        {users.map(async (user, i) => {
          const data = await user.data;

          const tracks = data.map(play => play.track)

          return (
            <TabsContent key={user.id + "-" + i} value={user.id}>
              {tracks.map((track, i) =>
                <TrackPlay key={track.id + "-" + user.id + "-" + i} track={track} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}