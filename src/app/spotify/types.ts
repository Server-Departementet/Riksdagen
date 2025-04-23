import type { Genre as PrismaGenre, Album as PrismaAlbum, Artist as PrismaArtist, Track as PrismaTrack, TrackPlay as PrismaTrackPlay } from "@prisma/client";
import { TrackSortingFunctions } from "./functions/track-sorting";

export type Track = PrismaTrack & { album: PrismaAlbum, artists: PrismaArtist[] };

export type TrackWithStats = Track & { totalMS: number, totalPlays: number, lastPlayedAt: Date };

export type TrackPlay = PrismaTrackPlay & { track: Track };

export type Genre = PrismaGenre;

export type User = {
  name: string;
  id: string;
  trackPlays: TrackPlay[];
};

export interface SortingOption {
  label: string;
  sortBy: TrackSortingFunctions;
  reverse?: boolean;
}

export type FilterPacket = FilterTracks; // | FilterArtists;

export type FilterTracks = {
  sorting: SortingOption | SortingOption[];
  genres?: {
    include?: string[] | null; // Genre ID's
    exclude?: string[] | null; // Genre ID's
  };
  artists?: {
    include?: string[] | null; // Artist ID's
    exclude?: string[] | null; // Artist ID's
  };
  albums?: {
    include?: string[] | null; // Album ID's
    exclude?: string[] | null; // Album ID's
  };
  playedAtRange?: {
    start?: Date | null; // If null, assume start of time
    end?: Date | null; // If null, assume end of time
  };
  playCountRange?: {
    min?: number | null; // If null, assume 0
    max?: number | null; // If null, assume max value of the dataset
  };
  playtimeRange?: {
    min?: number | null; // If null, assume 0
    max?: number | null; // If null, assume max value of the dataset
  };
  trackLengthRange?: {
    min?: number | null; // If null, assume 0
    max?: number | null; // If null, assume max value of the dataset
  };
};