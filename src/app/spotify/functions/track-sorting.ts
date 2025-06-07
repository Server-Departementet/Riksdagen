import type { SortingOption, TrackWithStats } from "@/app/spotify/types";

export const sortingFunctions: Record<
  "playtime" | "play_count" | "track_length" | "track_name" | "artist_name",
  SortingOption
> = {
  playtime: {
    label: "Speltid",
    id: "playtime",
    func: (a: TrackWithStats, b: TrackWithStats) => b.totalMS - a.totalMS,
  },
  play_count: {
    label: "Lyssningar",
    id: "play_count",
    func: (a: TrackWithStats, b: TrackWithStats) => b.totalPlays - a.totalPlays,
  },
  track_length: {
    label: "Låtlängd",
    id: "track_length",
    func: (a: TrackWithStats, b: TrackWithStats) => b.duration - a.duration,
  },
  track_name: {
    label: "Låtnamn",
    id: "track_name",
    func: (a: TrackWithStats, b: TrackWithStats) => a.name.localeCompare(b.name),
  },
  artist_name: {
    label: "Artist",
    id: "artist_name",
    func: (a: TrackWithStats, b: TrackWithStats) => {
      // Concatenate to get second, third, etc. artist names in order.
      const aArtists = a.artists.map((artist) => artist.name).join(", ");
      const bArtists = b.artists.map((artist) => artist.name).join(", ");
      return aArtists.localeCompare(bArtists);
    },
  },
};