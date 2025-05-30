import type {
  Genre as PrismaGenre,
  Album as PrismaAlbum,
  Artist as PrismaArtist,
  Track as PrismaTrack,
  TrackPlay as PrismaTrackPlay
} from "@/prisma/generated/client";
import { TrackSortingFunctions } from "./functions/track-sorting";

// Extend Prisma types to include relations
export type Track = PrismaTrack & { album: PrismaAlbum, artists: PrismaArtist[] };
export type TrackPlay = PrismaTrackPlay & { track: Track };
export type Genre = PrismaGenre;

export type User = {
  name: string; // User's name
  id: string; // User's ID provided by Clerk
}

export type TrackWithMeta = Track & {
  totalPlays: number;
  totalMS: number;
  playsPerUser: Record<string, number>;
  color?: string; // Color extracted from the track image, when missing it uses a default fallback
};

export interface SortingOption {
  label: string; // User facing label for the sorting option
  sortBy: TrackSortingFunctions; // String literal type for sorting function, (a,b) => number functions are indexed by this string
  reverse?: boolean;
}

export type FilterPacket = {
  sorting: SortingOption;
  users: string[]; // User ID's to include in the filter
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