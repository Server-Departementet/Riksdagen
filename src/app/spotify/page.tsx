import styles from "./spotify.module.css" with {type: "css"};
import { TrackPlayElement } from "@/components/spotify/track-play";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { prisma } from "@/lib/prisma";
import type { Track, TrackPlay, User } from "@/types";
import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import Link from "next/link";
import React from "react";

const client = clerkClient();

async function getUserData(userId: string, username: string) {
  const dbTrackPlaysForUser = await prisma.trackPlay.findMany({
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
    take: 50, // TODO - remove
  });

  const user: User = {
    id: userId,
    name: username,
    trackPlays: dbTrackPlaysForUser,
  }

  return user;
}

async function getTrackPlaytimes(trackPlays: TrackPlay[], tracks: Track[]): Promise<Record<string, number>> {
  const listenedTimes: Record<string, number> = {};

  tracks.forEach(track => {
    const totalMS = trackPlays
      .filter(play => play.track.id === track.id)
      .map(play => play.track.duration)
      .reduce((acc, duration) => acc + duration, 0); // ms
    listenedTimes[track.id] = totalMS;
  });

  return Object.fromEntries(Object.entries(listenedTimes).sort(([, a], [, b]) => b - a));
}

async function getAllTrackPlays(users: User[]): Promise<TrackPlay[]> {
  const allTracks: TrackPlay[] = users.flatMap(user => user.trackPlays);

  return allTracks;
}

export default async function SpotifyPage() {
  const clerkUserList = (await (await client).users.getUserList()).data.filter(user => user.publicMetadata.role === "minister").reverse();

  const users = await Promise.all(clerkUserList.map(async user => getUserData(user.id, user.firstName || user.id)));

  const allTrackPlays = await getAllTrackPlays(users);

  const uniqueTracks = allTrackPlays.map(play => play.track).filter((track, i, self) => self.findIndex(t => t.id === track.id) === i); // unique tracks

  const trackPlaytimes = await getTrackPlaytimes(allTrackPlays, uniqueTracks);

  const totalPlaytimeMS = Object.values(trackPlaytimes).reduce((acc, time) => acc + time, 0); // ms

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
              s: { time: totalPlaytimeMS / 1000, unitLong: "sekunder", unitShort: "s" },
              min: { time: totalPlaytimeMS / 60000, unitLong: "minuter", unitShort: "min" },
              h: { time: totalPlaytimeMS / 3600000, unitLong: "timmar", unitShort: "h" },
              d: { time: totalPlaytimeMS / 86400000, unitLong: "dygn", unitShort: "d" },
              w: { time: totalPlaytimeMS / 604800000, unitLong: "veckor", unitShort: "v" },
              m: { time: totalPlaytimeMS / 2419200000, unitLong: "månader", unitShort: "m" },
              y: { time: totalPlaytimeMS / 29030400000, unitLong: "år", unitShort: "å" },
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
            {Object.entries(trackPlaytimes).map(([trackId, trackMS], i) => {
              const track = uniqueTracks.find(track => track.id === trackId);
              if (!track) return null;
              return <TrackPlayElement track={track} listeningTime={parseFloat(trackMS.toString())} username={null} key={track.id + "-" + i} />;
            })}
          </div>

          {/* Absolute most listened to artist */}
        </TabsContent>

        {/* User tabs */}
        {users.map(async (user, i) => {
          const totalUserMS = user.trackPlays.map(play => play.track).reduce((acc, track) => acc + track.duration, 0); // ms
          const timeInDifferentUnits = {
            s: { time: totalUserMS / 1000, unitLong: "sekunder", unitShort: "s" },
            min: { time: totalUserMS / 60000, unitLong: "minuter", unitShort: "min" },
            h: { time: totalUserMS / 3600000, unitLong: "timmar", unitShort: "h" },
            d: { time: totalUserMS / 86400000, unitLong: "dygn", unitShort: "d" },
            w: { time: totalUserMS / 604800000, unitLong: "veckor", unitShort: "v" },
            m: { time: totalUserMS / 2419200000, unitLong: "månader", unitShort: "m" },
            y: { time: totalUserMS / 29030400000, unitLong: "år", unitShort: "å" },
          };

          const userTracks = user.trackPlays
            .map(play => play.track)
            .filter((track, i, self) => self.findIndex(t => t.id === track.id) === i) // unique tracks
            .sort((a, b) => {
              const aTime = trackPlaytimes[a.id] || 0;
              const bTime = trackPlaytimes[b.id] || 0;
              return bTime - aTime;
            });

          const userPlaytimes = await getTrackPlaytimes(user.trackPlays, userTracks);

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
                    <TooltipTrigger>{(totalUserMS / totalPlaytimeMS * 100).toFixed(2)}% av alla</TooltipTrigger>
                    <TooltipContent>{totalUserMS / totalPlaytimeMS * 100}%</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Tracks */}
              {Object.entries(userPlaytimes).map(([trackId, trackMS], i) => {
                const track = userTracks.find(track => track.id === trackId);
                if (!track) return null;
                return <TrackPlayElement track={track} listeningTime={parseFloat(trackMS.toString())} username={user.name} key={track.id + "-" + user.id + "-" + i} />;
              })}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}