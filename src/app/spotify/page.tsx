import type { User } from "@/types";
import React from "react";
import { prisma } from "@/lib/prisma";
import { JumpToTrackHighlightHandler } from "@/components/spotify/copy-link";
import { clerkClient } from "@clerk/nextjs/server";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDownIcon } from "lucide-react";
import { FilterCommandItem } from "@/app/spotify/components/filter-item";

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
    ...(process.env.NODE_ENV !== "production" ? { take: 100 } : {})
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

    <main className="flex-row justify-start items-start px-0 pb-0">
      {/* Filters */}
      <aside className="h-full min-w-1/4 flex-1 resize-x flex flex-col">
        <form action="" className="p-2 flex flex-col gap-y-2">
          <Button type="reset">
            Återställ alla
          </Button>

          {/* User select */}
          <Popover>
            {/* Trigger */}
            <PopoverTrigger asChild>
              <Button role="combobox" variant={"outline"} type="button">
                Filtrera användare
                <ChevronsUpDownIcon />
              </Button>
            </PopoverTrigger>
            {/* Select */}
            <PopoverContent>
              <Command>
                <CommandInput placeholder="Användarnamn" />
                <CommandList>
                  <CommandEmpty>Hittar inget</CommandEmpty>
                  <FilterCommandItem>Alla</FilterCommandItem>
                  {users.map(user => <FilterCommandItem key={user.name}>{user.name}</FilterCommandItem>)}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </form>

        {/* Reset */}

        {/* Which users */}
        {/* Searchable multi-select inclusive/exclusive. select/unselect all buttons */}

        {/* What results are shown, tracks | artists | album */}

        {/*
          Track filters

          Sorting:
          - playtime (d & a),
          - play count (d & a),
          - track length (d & a),
          - track name (a & d),
          - artist name (a & d), // Should probably combine with another sorting method
          - played at. unique tracks mapped to the latest played track play's time (d & a),
          - plays / time. Play frequency (d & a),
          - plays / artist. Artist popularity (d & a),

          Genre:
            Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

          Artist:
            Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

          Album:
            Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

          Listened date range:
            Slider + inputs on ends. "start date" and "end date"

          Listened count range:
            Slider + inputs on ends. "min count" and "max count"
        */}

        {/* 
          Artist filters

          Sorting:
          - playtime (d & a),
          - play count (d & a),
          - track count (d & a),
          - artist name (a & d),
          - played at. latest track play mapped to artists (d & a),
        */}
      </aside>

      {/* Result content */}
      <section>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Velit incidunt est sunt quos inventore, adipisci nostrum blanditiis, repudiandae minima quam error beatae natus iusto eos perferendis nemo, neque vero! A.
      </section>

      <JumpToTrackHighlightHandler />
    </main>
  );
}

// <Tabs className="mt-5 mb-10 w-full lg:w-10/12 flex flex-col items-center" defaultValue={(await headers()).get("x-opened-page") || "alla"}>
// {/* List */}
// <TabsList className="w-full mb-1 flex flex-row justify-start overflow-x-auto overflow-y-hidden">
//   {/* All */}
//   <Link href={"?person=alla"} className={`${styles.TabsTriggerLink} no-globals`}><TabsTrigger tabIndex={-1} className="" value="alla">Totalt</TabsTrigger></Link>
//
//   {/* Users */}
//   {users.map(async user => (
//     <Link
//       key={user.id}
//       href={`?person=${encodeURIComponent(user.name || "alla")}`}
//       className={`${styles.TabsTriggerLink} no-globals`}
//     >
//       <TabsTrigger tabIndex={-1} className="" value={encodeURIComponent(user.name || "alla") || user.id}>{user.name || "Saknar namn"}</TabsTrigger>
//     </Link>
//   ))}
// </TabsList>
//
// {/* Totals tab */}
// <TabsContent tabIndex={-1} value="alla" className="w-full lg:w-8/12">
//   <h3>Sammantagen statistik</h3>
//
//   <TimeAndPlayCountBar timeMS={globalPlaytimeMS} playCount={globalListenCount} />
//
//   {/* Top play count tracks */}
//   <h3 className="mt-3">Flest spelade låtar</h3>
//   <div className="flex flex-col gap-y-2 pt-2">
//     {uniqueTracks
//       .sort((a, b) => b.totalPlays - a.totalPlays)
//       .map((track, i) => {
//         return (
//           <TrackPlayElement
//             index={i}
//             track={track}
//             username="alla"
//             key={track.id + "-" + i + "-play"}
//           />
//         );
//       })}
//   </div>
//
//   {/* Top playtime tracks */}
//   <h3 className="mt-3">Mest lyssnade låtar</h3>
//   <div className="flex flex-col gap-y-2 pt-2">
//     {uniqueTracks
//       .sort((a, b) => b.totalMS - a.totalMS)
//       .map((track, i) => {
//         return (
//           <TrackPlayElement
//             index={i}
//             track={track}
//             username="alla"
//             key={track.id + "-" + i + "-time"}
//           />
//         );
//       })}
//   </div>
//
//   {/* Top artists */}
//   {/* TODO */}
// </TabsContent>
//
// {/* User tabs */}
// {users.map((user, i) => <UserTab key={i} user={user} />)}
// </Tabs>
