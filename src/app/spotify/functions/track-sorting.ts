import { TrackWithStats } from "../types";

export type TrackSortingFunctions = "playtime" | "playCount" | "trackLength" | "trackName" | "artistName" | "playedAt";

export const trackSortingFunctions: Record<TrackSortingFunctions, (a: TrackWithStats, b: TrackWithStats) => number> = {
  playtime: (a: TrackWithStats, b: TrackWithStats) => a.totalMS - b.totalMS,
  playCount: (a: TrackWithStats, b: TrackWithStats) => a.totalPlays - b.totalPlays,
  trackLength: (a: TrackWithStats, b: TrackWithStats) => a.duration - b.duration,
  trackName: (a: TrackWithStats, b: TrackWithStats) => a.name.localeCompare(b.name),
  artistName: (a: TrackWithStats, b: TrackWithStats) => {
    // Concatenate to get second, third, etc. artist names in order.
    const aArtists = a.artists.map((artist) => artist.name).join(", ");
    const bArtists = b.artists.map((artist) => artist.name).join(", ");
    return aArtists.localeCompare(bArtists);
  },
  playedAt: (a: TrackWithStats, b: TrackWithStats) => a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime(),
};