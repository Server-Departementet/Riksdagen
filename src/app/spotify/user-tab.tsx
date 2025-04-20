"use cache";

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

  return (
    <ParentsTabContent
      tabIndex={-1}
      value={encodeURIComponent(user.name || user.id)}
      className="w-full lg:w-8/12 flex flex-col gap-y-3"
    >
      <h3>{possessive(user.name)} statistik</h3>

      <TimeAndPlayCountBar timeMS={totalMS} playCount={totalPlays} />

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
                username={user.name}
                key={track.id + "-" + i}
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
                username={user.name}
                key={track.id + "-" + i + "-time"}
              />
            );
          })}
      </div>

    </ParentsTabContent>
  );
}