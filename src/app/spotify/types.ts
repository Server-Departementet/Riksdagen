import type { Album as PrismaAlbum, Artist as PrismaArtist, Track as PrismaTrack, TrackPlay as PrismaTrackPlay } from "@prisma/client";

export type Track = PrismaTrack & { album: PrismaAlbum, artists: PrismaArtist[] };

export type TrackWithStats = Track & { totalMS: number, totalPlays: number };

export type TrackPlay = PrismaTrackPlay & { track: Track };

export type User = {
  name: string;
  id: string;
  trackPlays: TrackPlay[];
};

export type FilterPacket = FilterTracks;

export type FilterTracks = {
  sorting: SortingOption[];
  genres: {
    include: string[];
    exclude: string[];
  };
  artists: {
    include: string[];
    exclude: string[];
  };
  albums: {
    include: string[];
    exclude: string[];
  };
  listenedRange: {
    start: Date | null; // If null, assume start of time
    end: Date | null; // If null, assume end of time
  };
}

export type SortingOption = {
  name: string;
  id: "playtime" | "play_count" | "track_length" | "track_name" | "artist_name" | "played_at" | "plays_per_time" | "plays_per_artist";
  reverse: boolean;
  sort: (a: Track, b: Track) => number;
}