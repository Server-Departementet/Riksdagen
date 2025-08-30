import type {
  Genre as PrismaGenre,
  Album as PrismaAlbum,
  Artist as PrismaArtist,
  Track as PrismaTrack,
  TrackPlay as PrismaTrackPlay
} from "@prisma/client";

// Extend Prisma types to include relations
export type TrackPlay = PrismaTrackPlay;
export type Genre = PrismaGenre;
export type Album = PrismaAlbum & { trackCount: number };
export type Artist = PrismaArtist;

export type FilterHash = string;
export type TrackId = string;
export type AlbumId = string;

export type User = {
  name: string; // User's name
  id: string; // User's ID provided by Clerk
}

export type Track = PrismaTrack & {
  album: Album;
  artists: Artist[];
  color?: string; // Color extracted from the track image, when missing it uses a default fallback
};

export type TrackStats = {
  trackId: string;
  totalPlays: number;
  totalMS: number;
  playsPerUser: Record<string, number>;
}

export type TrackWithStats = Track & TrackStats;

export type TrackWithPlays = Track & { TrackPlay: TrackPlay[] };

export const SortingMethod = {
  Default: "play_time",
  PlayTime: "play_time",
  PlayCount: "play_count",
  TrackLength: "track_length",
  TrackName: "track_name",
  ArtistName: "artist_name",
} as const;
export type SortingMethod = (typeof SortingMethod)[keyof typeof SortingMethod];

export const SortingMethodNames: Record<SortingMethod, string> = {
  play_time: "Speltid",
  play_count: "Lyssningar",
  track_length: "Låtlängd",
  track_name: "Låtnamn",
  artist_name: "Artist",
};

export const sortingFunctions: Record<SortingMethod, (a: TrackWithStats, b: TrackWithStats) => number> = {
  play_time: (a: TrackWithStats, b: TrackWithStats) => b.totalMS - a.totalMS,
  play_count: (a: TrackWithStats, b: TrackWithStats) => b.totalPlays - a.totalPlays,
  track_length: (a: TrackWithStats, b: TrackWithStats) => b.duration - a.duration,
  track_name: (a: TrackWithStats, b: TrackWithStats) => a.name.localeCompare(b.name),
  artist_name: (a: TrackWithStats, b: TrackWithStats) => {
    const aArtists = a.artists.map(artist => artist.name).join(", ");
    const bArtists = b.artists.map(artist => artist.name).join(", ");
    return aArtists.localeCompare(bArtists);
  },
};

export type Filter = {
  sort: SortingMethod,
  reverse: boolean,
  selectedUsers: User[],
  search: string,
};
export const defaultFilter: Filter = {
  sort: SortingMethod.Default,
  reverse: false,
  selectedUsers: [],
  search: "",
}