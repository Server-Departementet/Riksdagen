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
  users: {
    include: User[];
    exclude: User[];
  };
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