import { TrackWithStats } from "../types";

export type TrackSortingFunctions = "playtime" | "play_count" | "track_length" | "track_name" | "artist_name" | "played_at" | "default";
export const validTrackSortingFunctions = ["playtime", "play_count", "track_length", "track_name", "artist_name", "played_at"] as const;

export const trackSortingFunctions: Record<TrackSortingFunctions, (a: TrackWithStats, b: TrackWithStats) => number> = {
  default: (a: TrackWithStats, b: TrackWithStats) => trackSortingFunctions["playtime"](a, b),
  playtime: (a: TrackWithStats, b: TrackWithStats) => b.totalMS - a.totalMS,
  play_count: (a: TrackWithStats, b: TrackWithStats) => b.totalPlays - a.totalPlays,
  track_length: (a: TrackWithStats, b: TrackWithStats) => b.duration - a.duration,
  track_name: (a: TrackWithStats, b: TrackWithStats) => a.name.localeCompare(b.name),
  artist_name: (a: TrackWithStats, b: TrackWithStats) => {
    // Concatenate to get second, third, etc. artist names in order.
    const aArtists = a.artists.map((artist) => artist.name).join(", ");
    const bArtists = b.artists.map((artist) => artist.name).join(", ");
    return aArtists.localeCompare(bArtists);
  },
  played_at: (a: TrackWithStats, b: TrackWithStats) => a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime(),
};