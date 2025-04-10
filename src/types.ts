import type { Track as PrismaTrack } from "@prisma/client";

export type Minister = {
  title: string;
  name: string;
  description: string;
};

export type Track = PrismaTrack & {};