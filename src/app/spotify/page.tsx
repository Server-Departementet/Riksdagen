import styles from "./spotify.module.css" with {type: "css"};
import { TrackPlay } from "@/components/spotify/track-play";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
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
    // take: 1000, // TODO: remove
  });
}

export default async function SpotifyPage() {
  const users = (await (await client).users.getUserList()).data
    .filter(user => user.publicMetadata.role === "minister")
    .map(user => ({ name: user.firstName, id: user.id, data: getUserData(user.id) }))
    .reverse();

  let totalMS: number = 0;
  for (const user of users) {
    const data = await user.data;
    totalMS += data.map(play => play.track).reduce((acc, track) => acc + track.duration, 0); // ms
  }

  const awaitedUsers = await Promise.all(users.map(async user => {
    const data = await user.data;
    return { ...user, data };
  }));

  const mostListenedTracks = awaitedUsers
    .flatMap(user => user.data)
    .map(play => play.track)
    .map(track => {
      const trackMS = awaitedUsers
        .flatMap(user => user.data)
        .filter(play => play.track.id === track.id)
        .map(play => play.track)
        .reduce((acc, track) => acc + track.duration, 0); // ms
      return [track.id, trackMS];
    })
    // Remove duplicates
    .filter((track, i, self) => self.findIndex(t => t[0] === track[0]) === i)
    // Sort by listened time
    .sort((a, b) => {
      const aTime = a[1] || 0;
      const bTime = b[1] || 0;
      return parseFloat(bTime.toString()) - parseFloat(aTime.toString());
    })
    // .slice(0, 3);

  return (
    <main>
      <h1 className="mt-10">Spotify Statistik</h1>

      <Tabs className="mt-5 mb-10 w-full lg:w-10/12 flex flex-col items-center" defaultValue={(await headers()).get("x-opened-page") || "alla"}>
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

        {/* Totals tab */}
        <TabsContent tabIndex={-1} value="alla" className="w-full lg:w-8/12">
          <h3>Totala tiden mellan alla</h3>
          {(async () => {
            const timeInDifferentUnits = {
              s: { time: totalMS / 1000, unitLong: "sekunder", unitShort: "s" },
              min: { time: totalMS / 60000, unitLong: "minuter", unitShort: "min" },
              h: { time: totalMS / 3600000, unitLong: "timmar", unitShort: "h" },
              d: { time: totalMS / 86400000, unitLong: "dygn", unitShort: "d" },
              w: { time: totalMS / 604800000, unitLong: "veckor", unitShort: "v" },
              m: { time: totalMS / 2419200000, unitLong: "månader", unitShort: "m" },
              y: { time: totalMS / 29030400000, unitLong: "år", unitShort: "å" },
            };

            return (
              <div className="flex flex-row gap-x-2 justify-center whitespace-nowrap overflow-x-scroll">
                <TooltipProvider>
                  {Object.entries(timeInDifferentUnits).map(([key, values], i) =>
                    <React.Fragment key={key + "-" + i}>
                      <Tooltip>
                        <TooltipTrigger>{Math.floor(values.time)} {values.unitShort}</TooltipTrigger>
                        <TooltipContent>{values.time.toString() + " " + values.unitLong}</TooltipContent>
                      </Tooltip>

                      {/* Separator */}
                      {i < Object.entries(timeInDifferentUnits).length - 1 && <span className="cursor-default">{"="}</span>}
                    </React.Fragment>
                  )}
                </TooltipProvider>
              </div>
            )
          })()}

          {/* Absolute most listened to track */}
          <h3 className="mt-2">Mest spelade låtar</h3>
          <div className="flex flex-col gap-y-2 pt-2">
            {mostListenedTracks.map(([trackId, trackMS], i) => {
              const track = awaitedUsers.flatMap(user => user.data).find(play => play.track.id === trackId)?.track;
              if (!track) return null;

              return (
                <TrackPlay track={track} listeningTime={parseFloat(trackMS.toString())} username={null} key={track.id + "-" + i} />
              );
            })}
          </div>

          {/* Absolute most listened to artist */}
        </TabsContent>

        {/* User tabs */}
        {users.map(async (user, i) => {
          const data = await user.data;

          const totalUserMS = data.map(play => play.track).reduce((acc, track) => acc + track.duration, 0); // ms
          const timeInDifferentUnits = {
            s: { time: totalUserMS / 1000, unitLong: "sekunder", unitShort: "s" },
            min: { time: totalUserMS / 60000, unitLong: "minuter", unitShort: "min" },
            h: { time: totalUserMS / 3600000, unitLong: "timmar", unitShort: "h" },
            d: { time: totalUserMS / 86400000, unitLong: "dygn", unitShort: "d" },
            w: { time: totalUserMS / 604800000, unitLong: "veckor", unitShort: "v" },
            m: { time: totalUserMS / 2419200000, unitLong: "månader", unitShort: "m" },
            y: { time: totalUserMS / 29030400000, unitLong: "år", unitShort: "å" },
          };

          const uniqueTracks = data.map(play => play.track).filter((track, i, self) => self.findIndex(t => t.id === track.id) === i); // unique tracks
          const listenedTimes = Object.fromEntries(uniqueTracks.map(track => {
            const totalMS = data.filter(play => play.track.id === track.id).map(play => play.track).reduce((acc, track) => acc + track.duration, 0); // ms
            return [track.id, totalMS];
          }));

          return (
            <TabsContent tabIndex={-1} key={user.id + "-" + i} value={encodeURIComponent(user.name || user.id)} className="w-full lg:w-8/12 flex flex-col gap-y-3">
              {/* User stats */}
              <div className="flex flex-row gap-x-2 whitespace-nowrap overflow-x-scroll">
                Total tid för {user.name}:
                <TooltipProvider>
                  {Object.entries(timeInDifferentUnits).map(([key, values], i) =>
                    <React.Fragment key={key + "-" + i}>
                      <Tooltip>
                        <TooltipTrigger>{Math.floor(values.time)} {values.unitShort}</TooltipTrigger>
                        <TooltipContent>{values.time.toString() + " " + values.unitLong}</TooltipContent>
                      </Tooltip>

                      {/* Separator */}
                      {/* {i < Object.entries(timeInDifferentUnits).length - 1 && <span className="cursor-default">{"="}</span>} */}
                      <span className="cursor-default">{"="}</span>
                    </React.Fragment>
                  )}
                  <Tooltip>
                    <TooltipTrigger>{(totalUserMS / totalMS * 100).toFixed(2)}% av alla</TooltipTrigger>
                    <TooltipContent>{totalUserMS / totalMS * 100}%</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Tracks */}
              {uniqueTracks
                // Sort by listened time
                .sort((a, b) => {
                  const aTime = listenedTimes[a.id] || 0;
                  const bTime = listenedTimes[b.id] || 0;
                  return bTime - aTime;
                })
                .map((track, i) =>
                  <TrackPlay track={track} listeningTime={listenedTimes[track.id]} username={user.name} key={track.id + "-" + user.id + "-" + i} />
                )}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}