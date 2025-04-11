import type { Album as PrismaAlbum, Artist as PrismaArtist, Track as PrismaTrack } from "@prisma/client";

export type Minister = {
  title: string;
  name: string;
  description: string;
};

export type Track = PrismaTrack & { album: PrismaAlbum, artists: PrismaArtist[] };