export const SPOTIFY_SORT_OPTIONS = [
  { value: "listen-count", label: "Lyssningar" },
  { value: "listen-time", label: "Lyssningstid" },
  { value: "track-length", label: "Längd" },
  { value: "artist-name", label: "Artistnamn" },
  { value: "track-name", label: "Låtnamn" },
] as const;

export type SpotifySortValue = typeof SPOTIFY_SORT_OPTIONS[number]["value"];
export type SpotifySortDirection = "asc" | "desc";

export const DEFAULT_SPOTIFY_SORT_VALUE: SpotifySortValue = "listen-count";
export const DEFAULT_SPOTIFY_SORT_DIRECTION: SpotifySortDirection = "desc";

export const isSpotifySortValue = (value: string | undefined): value is SpotifySortValue =>
  typeof value === "string" && SPOTIFY_SORT_OPTIONS.some(option => option.value === value);
