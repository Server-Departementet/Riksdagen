import styles from "./spotify.module.css" with {type: "css"};
import { TrackPlay } from "@/components/spotify/track-play";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import Link from "next/link";

const client = clerkClient();

async function getUserData(userId: string) {
  return await prisma.trackPlay.findMany({
    where: {
      userId: userId,
    },
    include: {
      track: {
        include: {
          artists: true,
          album: true,
        }
      },
    },
    take: 50, // TODO: remove
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

      <Tabs className="mt-5 mb-10 w-10/12 flex flex-col items-center" defaultValue={(await headers()).get("x-opened-page") || "alla"}>
        {/* List */}
        <TabsList className="w-full mb-1 flex flex-row">
          {/* All */}
          <Link href={"?person=alla"} className={`${styles.TabsTriggerLink} no-globals`}>
            <TabsTrigger tabIndex={-1} value="alla">
              Totalt
            </TabsTrigger>
          </Link>

          {/* Users */}
          {users.map(async user => (
            <Link href={`?person=${encodeURIComponent(user.name || "alla")}`} key={user.id} className={`${styles.TabsTriggerLink} no-globals`}>
              <TabsTrigger tabIndex={-1} value={encodeURIComponent(user.name || "alla") || user.id}>
                {user.name || "Saknar namn"}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>

        {/* Totals */}
        <TabsContent tabIndex={-1} value="alla" className="w-8/12">
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

        {/* User tabs */}
        {users.map(async (user, i) => {
          const data = await user.data;

          const tracks = data.map(play => play.track)

          return (
            <TabsContent tabIndex={-1} key={user.id + "-" + i} value={encodeURIComponent(user.name || user.id)} className="w-8/12 flex flex-col gap-y-2">
              {tracks.map((track, i) =>
                <TrackPlay user={user} key={track.id + "-" + user.id + "-" + i} track={track} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}