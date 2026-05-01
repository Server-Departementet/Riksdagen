import { Track } from "@/prisma/generated";

export type Minister = {
  holder: string;
  title: string;
  role: string;
  createdAt: string;
  order: number;
  color: string;
  description: string;
};

export type TrackWithCompany = Track & {
  album: {
    name: string;
    id: string;
    url: string;
    image: string | null;
    color: string | null;
    releaseDate: Date | null;
  };
  artists: {
    name: string;
    id: string;
    url: string;
    image: string | null;
    color: string | null;
  }[];
  _count: {
    TrackPlays: number;
  };
  mergedVariantCount?: number;
} & {
  name: string;
  id: string;
  url: string;
  duration: number;
  albumId: string;
};