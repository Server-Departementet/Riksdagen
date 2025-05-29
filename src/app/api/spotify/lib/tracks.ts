import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import { Track, TrackPlay, TrackWithMeta } from "@/app/spotify/types";

export async function compileTrackWithMeta(
  track: Track,
  trackPlays: TrackPlay[]
): Promise<TrackWithMeta> {
  const thesePlays = trackPlays.filter(play => play.trackId === track.id);
  const totalMS: number = thesePlays.reduce((acc, play) => acc + play.track.duration, 0);
  const totalPlays: number = thesePlays.length;
  const playsPerUser: Record<string, number> = thesePlays.reduce((acc, play) => {
    acc[play.userId] = (acc[play.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const color = track.image ? await getTrackBGColor(track.image) : undefined;

  return {
    ...track,
    totalMS,
    totalPlays,
    playsPerUser,
    color,
  };
}