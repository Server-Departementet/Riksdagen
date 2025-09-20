"use server";
import "server-only";
import { prisma } from "@/lib/prisma";
import { Filter, Track, TrackPlay, TrackPlayMap, TrackWithStats } from "../types";
import { getTrackBGColor } from "./get-track-color";
import { getMinisterIds } from "@/lib/auth";

export async function getTracks(ids?: string[]): Promise<Track[]> {
  "use cache";

  const tracks: Track[] = (await prisma.track.findMany({
    // Select specific ids if provided
    ...(ids ? { where: { id: { in: ids } } } : {}),
    orderBy: { TrackPlay: { _count: "desc" } },
    include: {
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
    .map((t): Track => ({
      id: t.id,
      name: t.name,
      duration: t.duration,
      image: t.image,
      album: { ...t.album, trackCount: t.album._count.tracks },
      albumId: t.albumId,
      artists: t.artists,
      url: t.url,
      color: null, // To be filled later
    }));

  // Add colors
  await Promise.all(tracks.map(async (track) => {
    track.color = await getTrackBGColor(track.image);
  }));

  return tracks;
}

export async function getTracksWithStats(tracks: Track[], playsMap: TrackPlayMap): Promise<TrackWithStats[]> {
  "use cache";

  const tracksWithStats: TrackWithStats[] = tracks.map(t => {
    const thesePlays = playsMap[t.id] || [];

    const playsPerUser = Object.fromEntries(
      userIds.map(id => [
        id,
        thesePlays.filter(p => p.userId === id).length,
      ])
    );
    const totalPlays = thesePlays.length;
    const totalMS = totalPlays * t.duration;

    return {
      ...t,
      playsPerUser,
      totalPlays,
      totalMS,
    };
  });

  return tracksWithStats;
}

export async function getTrackPlays(id?: string): Promise<TrackPlay[]> {
  "use cache";

  const plays: TrackPlay[] = await prisma.trackPlay.findMany({
    ...(id ? { where: { trackId: id } } : {}),
    orderBy: { playedAt: "desc" },
  });

  return plays;
}

function createTrackPlayMap(plays: TrackPlay[]): TrackPlayMap {
  const map: TrackPlayMap = {};
  for (const play of plays) {
    if (map[play.id]) map[play.id].push(play);
    else map[play.id] = [play];
  }
  return map;
}


const userIds = getMinisterIds();

export async function getFilteredTracks(filter: Filter): Promise<TrackWithStats[]> {
  "use cache";

  const tracksNoStats = await getTracks();
  const outTracks: Track[] = [...tracksNoStats];

  const trackPlays = await getTrackPlays();
  const trackPlayMap = createTrackPlayMap(trackPlays);
  const outPlays: TrackPlayMap = { ...trackPlayMap };

  for (const track of tracksNoStats) {
    const thesePlays = outPlays[track.id] || [];

    // Search
    if (filter.search) {
      const searchString = filter.search.trim().toLowerCase();

      const trackName = track.name.toLowerCase();
      const artistsNames = track.artists.map(a => a.name).join(", ").toLowerCase();
      const albumName = track.album.name.toLowerCase();

      if (
        trackName.indexOf(searchString) === -1
        &&
        artistsNames.indexOf(searchString) === -1
        &&
        albumName.indexOf(searchString) === -1
      ) {
        // No match, remove the track
        const trackIndex = outTracks.indexOf(track);
        if (trackIndex > -1) outTracks.splice(trackIndex, 1);
      }
    }

    // User filter
    if (filter.selectedUsers.length) { // No users selected means to show all
      const providedIds = filter.selectedUsers.map(u => u.id);
      const cleanedUserIds = userIds.filter(id => providedIds.includes(id)); // Take the intersection of minister ids and provided ids

      for (const play of thesePlays) {
        if (!cleanedUserIds.includes(play.userId)) {
          // Play by a user not in the filter, remove it
          const index = outPlays[track.id].indexOf(play);
          if (index > -1) outPlays[track.id].splice(index, 1);
        }

        // If no plays remain for this track, remove the track
        if (outPlays[track.id].length === 0) {
          const trackIndex = outTracks.indexOf(track);
          if (trackIndex > -1) outTracks.splice(trackIndex, 1);
        }
      }
    }
  }

  const tracksWithStats = getTracksWithStats(outTracks, outPlays);
  return tracksWithStats;
}

export async function getFilteredTrackIDs(filter: Filter): Promise<string[]> {
  const tracks = await getFilteredTracks(filter);
  return tracks.map(t => t.id);
}

export async function getTracksByIds(ids: string[]): Promise<TrackWithStats[]> {
  const tracks = await getTracks(ids);
  const plays = await getTrackPlays();
  const playMap = createTrackPlayMap(plays);
  const tracksWithStats = await getTracksWithStats(tracks, playMap);
  return tracksWithStats;
}