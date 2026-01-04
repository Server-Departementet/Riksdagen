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

export type TrackWithData = Track & {
  album: {
    name: string;
    id: string;
    url: string;
    image: string | null;
    color: string | null;
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
} & {
  name: string;
  id: string;
  url: string;
  duration: number;
  albumId: string;
};