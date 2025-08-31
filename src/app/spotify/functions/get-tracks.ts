import { prisma } from "@/lib/prisma";
import { TrackWithStats } from "../types";
import { getTrackBGColor } from "./get-track-color";

export async function getTracks() {
  "use cache";

  const tracks: TrackWithStats[] = (await prisma.track.findMany({
    orderBy: { TrackPlay: { _count: "desc" } },
    include: {
      _count: {
        select: { TrackPlay: true },
      },
      artists: true,
      album: {
        include: {
          _count: {
            select: { tracks: true },
          },
        },
      },
    },
  }))
    .map((t): TrackWithStats => ({
      id: t.id,
      name: t.name,
      duration: t.duration,
      image: t.image,
      album: { ...t.album, trackCount: t.album._count.tracks },
      albumId: t.albumId,
      artists: t.artists,
      playsPerUser: {}, // To be filled later 
      totalMS: t._count.TrackPlay * t.duration,
      totalPlays: t._count.TrackPlay,
      trackId: t.id,
      url: t.url,
      color: null, // To be filled later
    }));

  // Add colors
  await Promise.all(tracks.map(async (track) => {
    track.color = await getTrackBGColor(track.image);
  }));

  return tracks;
}

export async function getTrack(trackId: string) {
  "use cache";

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      _count: {
        select: { TrackPlay: true },
      },
      artists: true,
      album: {
        include: {
          _count: {
            select: { tracks: true },
          },
        },
      },
    },
  });

  if (!track) return null;

  const trackWithStats: TrackWithStats = {
    id: track.id,
    name: track.name,
    duration: track.duration,
    image: track.image,
    album: { ...track.album, trackCount: track.album._count.tracks },
    albumId: track.albumId,
    artists: track.artists,
    playsPerUser: {}, // To be filled later 
    totalMS: track._count.TrackPlay * track.duration,
    totalPlays: track._count.TrackPlay,
    trackId: track.id,
    url: track.url,
    color: await getTrackBGColor(track.image),
  };

  return trackWithStats;
}