import { TrackSortingFunctions, trackSortingFunctions, validTrackSortingFunctions } from "@/app/spotify/functions/track-sorting";
import type { FilterPacket, Track, TrackPlay, TrackWithMeta } from "@/app/spotify/types";
import { NextRequest } from "next/server";

export function filterTracks(tracks: Track[], trackPlays: TrackPlay[], filter: FilterPacket) {
  const filteredTrackPlays = trackPlays.filter(trackPlay => {
    // Exclude all plays that are from non-selected users
    if (!filter.users.includes(trackPlay.userId)) return false;

    return true;
  });

  const filteredTracks = tracks.filter(track => {
    // Exclude if it has no plays
    if (!filteredTrackPlays.some(play => play.trackId === track.id)) return false;

    return true;
  });

  return { filteredTracks, filteredTrackPlays };
}

export function sortTracks(tracks: TrackWithMeta[], filter: FilterPacket) {
  // Find sorting function with provided name by looking it up in the validTrackSortingFunctions array 
  const sortFunction = trackSortingFunctions[
    (validTrackSortingFunctions
      .map(func => func.toLowerCase())
      .find(func => func === filter.sorting.sortBy)
      || "default"
    ) as TrackSortingFunctions
  ];
  return tracks.sort(sortFunction);
}

export async function extractFilter(req: NextRequest): Promise<FilterPacket> {
  // Extract filter from request body
  const filter = (await req.json()) as FilterPacket;

  // Validate filter
  if (!filter || !filter.sorting || !validTrackSortingFunctions.includes(filter.sorting.sortBy) || !filter.users || !filter.genres || !filter.artists || !filter.albums) {
    return new Promise(() => null);
  }

  return filter;
}