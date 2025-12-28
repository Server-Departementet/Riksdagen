import type {
  Genre as PrismaGenre,
  Album as PrismaAlbum,
  Artist as PrismaArtist,
  Track as PrismaTrack,
  TrackPlay as PrismaTrackPlay
} from "@/prisma/client";

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

export interface SortingOption {
  label: string; // User facing name
  id: "playtime" | "play_count" | "track_length" | "track_name" | "artist_name";
  func: (a: TrackWithStats, b: TrackWithStats) => number;
};

export type LocalFilterPacket = {
  search: string;
  sort: SortingOption["id"];
  reverseOrder: boolean;
  album: {
    sort: {
      id: "name" | "track_count"; // Sorting options for albums
      reverseOrder: boolean; // Whether to reverse the order of the sort
    },
    include: AlbumId[];
  };
};

export type FetchFilterPacket = {
  sort: SortingOption["id"];
  reverseOrder: boolean;
  users: User[]; // User ID's to include in the filter
  genres: {
    include: string[]; // Genre ID's
    exclude: string[]; // Genre ID's
  };
  artists: {
    include: string[]; // Artist ID's
    exclude: string[]; // Artist ID's
  };
  albums: {
    include: string[]; // Album ID's
    exclude: string[]; // Album ID's
  };
  playedAtRange?: {
    start?: Date; // If null, assume start of time
    end?: Date; // If null, assume end of time
  };
  playCountRange?: {
    min?: number; // If null, assume 0
    max?: number; // If null, assume max value of the dataset
  };
  playtimeRange?: {
    min?: number; // If null, assume 0
    max?: number; // If null, assume max value of the dataset
  };
  trackLengthRange?: {
    min?: number; // If null, assume 0
    max?: number; // If null, assume max value of the dataset
  };
};