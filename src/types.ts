import type { Album as PrismaAlbum, Artist as PrismaArtist, Track as PrismaTrack, TrackPlay as PrismaTrackPlay } from "@prisma/client";

export type Minister = {
  title: string;
  name: string;
  description: string;
};

export type Track = PrismaTrack & { album: PrismaAlbum, artists: PrismaArtist[] };

export type TrackWithStats = Track & { totalMS: number, totalPlays: number };

export type TrackPlay = PrismaTrackPlay & { track: Track };

export type User = {
  name: string;
  id: string;
  trackPlays: TrackPlay[];
}