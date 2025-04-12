import styles from "./spotify.module.css" with {type: "css"};
import { TrackPlay } from "@/components/spotify/track-play";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import Link from "next/link";
import React from "react";

const client = clerkClient();

async function getUserData(userId: string) {
  return await prisma.trackPlay.findMany({
    orderBy: {
      playedAt: "desc",
    },
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
    take: 3, // TODO: remove
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

      <Tabs className="mt-5 mb-10 w-full sm:w-10/12 flex flex-col items-center" defaultValue={(await headers()).get("x-opened-page") || "alla"}>
        {/* List */}
        <TabsList className="w-full mb-1 flex flex-row justify-start overflow-x-scroll">
          {/* All */}
          <Link href={"?person=alla"} className={`${styles.TabsTriggerLink} no-globals`}>
            <TabsTrigger tabIndex={-1} className="" value="alla">
              Totalt
            </TabsTrigger>
          </Link>

          {/* Users */}
          {users.map(async user => (
            <Link href={`?person=${encodeURIComponent(user.name || "alla")}`} key={user.id} className={`${styles.TabsTriggerLink} no-globals`}>
              <TabsTrigger tabIndex={-1} className="" value={encodeURIComponent(user.name || "alla") || user.id}>
                {user.name || "Saknar namn"}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>

        {/* Totals */}
        <TabsContent tabIndex={-1} value="alla" className="w-full sm:w-8/12">
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

          const totalMS = data.map(play => play.track).reduce((acc, track) => acc + track.duration, 0); // ms
          const timeInDifferentUnits = {
            s: { time: totalMS / 1000, unitLong: "sekunder", unitShort: "s" },
            min: { time: totalMS / 60000, unitLong: "minuter", unitShort: "min" },
            h: { time: totalMS / 3600000, unitLong: "timmar", unitShort: "h" },
            d: { time: totalMS / 86400000, unitLong: "dygn", unitShort: "d" },
            w: { time: totalMS / 604800000, unitLong: "veckor", unitShort: "v" },
            m: { time: totalMS / 2419200000, unitLong: "månader", unitShort: "m" },
            y: { time: totalMS / 29030400000, unitLong: "år", unitShort: "å" },
          };

          const tracks = data.map(play => play.track).filter((track, i, self) => self.findIndex(t => t.id === track.id) === i); // unique tracks

          return (
            <TabsContent tabIndex={-1} key={user.id + "-" + i} value={encodeURIComponent(user.name || user.id)} className="w-full sm:w-8/12 flex flex-col gap-y-3">
              {/* Total times */}
              <div className="flex flex-row gap-x-2 whitespace-nowrap overflow-x-scroll">
                Totalt:
                {Object.entries(timeInDifferentUnits).map(([key, values], i) =>
                  <React.Fragment key={key + "-" + i}>
                    <span
                      className="cursor-help"
                      title={values.time.toString() + " " + values.unitLong}>
                      {Math.floor(values.time)} {values.unitShort}
                    </span>
                    {i < Object.entries(timeInDifferentUnits).length - 1 && <span>=</span>}
                  </React.Fragment>
                )}
              </div>

              {/* Tracks */}
              {tracks.map((track, i) =>
                <TrackPlay track={track} listeningTime={0} username={user.name} key={track.id + "-" + user.id + "-" + i} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}