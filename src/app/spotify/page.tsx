import type { User } from "@/types";
import styles from "./spotify.module.css" with {type: "css"};
import React from "react";
import Link from "next/link";
import { UserTab } from "@/app/spotify/user-tab";
import { TrackPlayElement } from "@/components/spotify/track-play";
import { TimeAndPlayCountBar } from "@/components/sidebar/time-units-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma";
import { JumpToTrackHighlightHandler } from "@/components/spotify/copy-link";
import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";

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
    ...(process.env.NODE_ENV !== "production" ? { take: 50 } : {})
  });

  const user: User = {
    id: userId,
    name: username,
    trackPlays: dbTrackPlaysForUser,
  }

  return user;
}

export default async function SpotifyPage() {
  const clerkUserList = (await (await client).users.getUserList()).data.filter(user => user.publicMetadata.role === "minister").reverse();

  const users = await Promise.all(clerkUserList.map(async user => getUserData(user.id, user.firstName || user.id)));

  const allTrackPlays = users.flatMap(user => user.trackPlays);
  const uniqueTracks = allTrackPlays
    .map(play => play.track)
    .filter((track, i, self) => self.findIndex(t => t.id === track.id) === i) // unique tracks
    .map(track => {
      const allPlays = allTrackPlays.filter(play => play.track.id === track.id);
      const totalMS = allPlays.reduce((acc, play) => acc + play.track.duration, 0);
      const totalPlays = allPlays.length;
      return {
        ...track,
        totalMS,
        totalPlays,
      };
    });

  const globalPlaytimeMS = uniqueTracks.reduce((acc, track) => acc + track.totalMS, 0);
  const globalListenCount = uniqueTracks.reduce((acc, track) => acc + track.totalPlays, 0);

  return (
    <main>
      <h1 className="mt-10">Spotify-Statistik</h1>

      <Tabs className="mt-5 mb-10 w-full lg:w-10/12 flex flex-col items-center" defaultValue={(await headers()).get("x-opened-page") || "alla"}>
        {/* List */}
        <TabsList className="w-full mb-1 flex flex-row justify-start overflow-x-auto overflow-y-hidden">
          {/* All */}
          <Link href={"?person=alla"} className={`${styles.TabsTriggerLink} no-globals`}><TabsTrigger tabIndex={-1} className="" value="alla">Totalt</TabsTrigger></Link>

          {/* Users */}
          {users.map(async user => (
            <Link
              key={user.id}
              href={`?person=${encodeURIComponent(user.name || "alla")}`}
              className={`${styles.TabsTriggerLink} no-globals`}
            >
              <TabsTrigger tabIndex={-1} className="" value={encodeURIComponent(user.name || "alla") || user.id}>{user.name || "Saknar namn"}</TabsTrigger>
            </Link>
          ))}
        </TabsList>

        {/* Totals tab */}
        <TabsContent tabIndex={-1} value="alla" className="w-full lg:w-8/12">
          <h3>Sammantagen statistik</h3>

          <TimeAndPlayCountBar timeMS={globalPlaytimeMS} playCount={globalListenCount} />

          {/* Top play count tracks */}
          <h3 className="mt-3">Flest spelade låtar</h3>
          <div className="flex flex-col gap-y-2 pt-2">
            {uniqueTracks
              .sort((a, b) => b.totalPlays - a.totalPlays)
              .map((track, i) => {
                return (
                  <TrackPlayElement
                    index={i}
                    track={track}
                    username="alla"
                    key={track.id + "-" + i + "-play"}
                  />
                );
              })}
          </div>

          {/* Top playtime tracks */}
          <h3 className="mt-3">Mest lyssnade låtar</h3>
          <div className="flex flex-col gap-y-2 pt-2">
            {uniqueTracks
              .sort((a, b) => b.totalMS - a.totalMS)
              .map((track, i) => {
                return (
                  <TrackPlayElement
                    index={i}
                    track={track}
                    username="alla"
                    key={track.id + "-" + i + "-time"}
                  />
                );
              })}
          </div>

          {/* Top artists */}
          {/* TODO */}
        </TabsContent>

        {/* User tabs */}
        {users.map((user, i) => <UserTab key={i} user={user} />)}
      </Tabs>

      <JumpToTrackHighlightHandler />
    </main>
  );
}