"use server";

import type { TrackWithStats, User } from "@/types";
import { TimeAndPlayCountBar } from "@/components/sidebar/time-units-bar";
import { TrackPlayElement } from "@/components/spotify/track-play";
import { TabsContent as ParentsTabContent } from "@/components/ui/tabs";
import { possessive } from "@/lib/i18n/formatters";

export async function UserTab({
  user,
}: {
  user: User,
}) {
  "use cache";

  const uniqueTracks: TrackWithStats[] = user.trackPlays
    .map(play => play.track)
    .filter((track, i, self) => self.findIndex(t => t.id === track.id) === i) // Gets uniques
    .map(track => {
      const allPlays = user.trackPlays.filter(play => play.track.id === track.id);
      const totalMS = allPlays.reduce((acc, play) => acc + play.track.duration, 0); // ms
      const totalPlays = allPlays.length;
      return {
        ...track,
        totalMS,
        totalPlays,
      };
    });

  const totalMS = uniqueTracks.reduce((acc, track) => acc + track.totalMS, 0); // ms
  const totalPlays = uniqueTracks.reduce((acc, track) => acc + track.totalPlays, 0);

  const tracksByPlayCount: TrackWithStats[] = uniqueTracks.sort((a, b) => b.totalPlays - a.totalPlays);
  const tracksByPlayTime: TrackWithStats[] = uniqueTracks.sort((a, b) => b.totalMS - a.totalMS);

  return (
    <ParentsTabContent
      tabIndex={-1}
      value={encodeURIComponent(user.name || user.id)}
      className="w-full flex flex-col gap-y-3"
    >
      <div className="flex flex-col">
        <h3>{possessive(user.name)} statistik</h3>
        <TimeAndPlayCountBar timeMS={totalMS} playCount={totalPlays} />
      </div>


    </ParentsTabContent>
  );
}