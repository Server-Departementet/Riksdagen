import type { TrackWithMeta } from "../types";

export type TrackSortingFunctions = "playtime" | "play_count" | "track_length" | "track_name" | "artist_name" | "played_at" | "default";
export const validTrackSortingFunctions = ["playtime", "play_count", "track_length", "track_name", "artist_name", "played_at", "default"] as const;

export const trackSortingFunctions: Record<TrackSortingFunctions, (a: TrackWithMeta, b: TrackWithMeta) => number> = {
  default: (a: TrackWithMeta, b: TrackWithMeta) => trackSortingFunctions["playtime"](a, b),
  playtime: (a: TrackWithMeta, b: TrackWithMeta) => b.totalMS - a.totalMS,
  play_count: (a: TrackWithMeta, b: TrackWithMeta) => b.totalPlays - a.totalPlays,
  track_length: (a: TrackWithMeta, b: TrackWithMeta) => b.duration - a.duration,
  track_name: (a: TrackWithMeta, b: TrackWithMeta) => a.name.localeCompare(b.name),
  artist_name: (a: TrackWithMeta, b: TrackWithMeta) => {
    // Concatenate to get second, third, etc. artist names in order.
    const aArtists = a.artists.map((artist) => artist.name).join(", ");
    const bArtists = b.artists.map((artist) => artist.name).join(", ");
    return aArtists.localeCompare(bArtists);
  },
  played_at: (a: TrackWithMeta, b: TrackWithMeta) => a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime(),
};