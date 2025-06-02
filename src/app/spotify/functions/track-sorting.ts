import type { SortingOption, TrackWithMeta } from "@/app/spotify/types";

export const sortingFunctions: Record<
  "playtime" | "play_count" | "track_length" | "track_name" | "artist_name" | "default",
  SortingOption
> = {
  playtime: {
    label: "Speltid",
    id: "playtime",
    func: (a: TrackWithMeta, b: TrackWithMeta) => b.totalMS - a.totalMS,
  },
  play_count: {
    label: "Lyssningar",
    id: "play_count",
    func: (a: TrackWithMeta, b: TrackWithMeta) => b.totalPlays - a.totalPlays,
  },
  track_length: {
    label: "Låtlängd",
    id: "track_length",
    func: (a: TrackWithMeta, b: TrackWithMeta) => b.duration - a.duration,
  },
  track_name: {
    label: "Låtnamn",
    id: "track_name",
    func: (a: TrackWithMeta, b: TrackWithMeta) => a.name.localeCompare(b.name),
  },
  artist_name: {
    label: "Artist",
    id: "artist_name",
    func: (a: TrackWithMeta, b: TrackWithMeta) => {
      // Concatenate to get second, third, etc. artist names in order.
      const aArtists = a.artists.map((artist) => artist.name).join(", ");
      const bArtists = b.artists.map((artist) => artist.name).join(", ");
      return aArtists.localeCompare(bArtists);
    },
  },
  default: {
    label: "Default",
    id: "default",
    func: (_a, _b) => 0,
  }
};
sortingFunctions.default = { ...sortingFunctions.play_count };