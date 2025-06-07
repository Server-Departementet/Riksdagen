import type { FetchFilterPacket, TrackWithPlays, TrackWithStats } from "@/app/spotify/types";

import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";
import { defaultFetchFilter } from "@/app/spotify/context/fetch-filter-context";

export default async function filterTracks(tracks: TrackWithPlays[], filter: FetchFilterPacket): Promise<TrackWithStats[]> {
  const filteredTracks: TrackWithStats[] = await Promise.all(tracks
    /* No plays */
    .filter(track => {
      // If the track has no plays, skip it
      if (track.TrackPlay.length === 0) return false;

      // If the track has plays, include it
      return true;
    })
    /* User filter */
    .filter(track => {
      const users = filter.users;
      
      const touchedUsers = new Set(track.TrackPlay.map(play => play.userId));

      // If the track has plays by any of the users, include it
      return users.some(user => touchedUsers.has(user.id));
    })
    /* Artist filter */
    .filter(track => {
      const includedArtists = filter.artists.include;
      const excludedArtists = filter.artists.exclude;

      // If no artists are included, include all tracks
      if (includedArtists.length === 0 && excludedArtists.length === 0) return true;

      // If artists are included, check if the track has any of them
      if (includedArtists.length > 0) {
        const trackArtists = track.artists.map(artist => artist.id);
        return includedArtists.some(artistId => trackArtists.includes(artistId));
      }

      // If artists are excluded, check if the track has any of them
      if (excludedArtists.length > 0) {
        const trackArtists = track.artists.map(artist => artist.id);
        return !excludedArtists.some(artistId => trackArtists.includes(artistId));
      }

      // If no artists are included or excluded, include the track
      return true;
    })
    /* Album filter */
    .filter(track => {
      const includedAlbums = filter.albums.include;
      const excludedAlbums = filter.albums.exclude;

      // If no albums are included or excluded, include the track
      if (includedAlbums.length === 0 && excludedAlbums.length === 0) return true;

      // If albums are included, check if the track's album is in the list
      if (includedAlbums.length > 0) {
        return includedAlbums.includes(track.album.id);
      }

      // If albums are excluded, check if the track's album is not in the list
      if (excludedAlbums.length > 0) {
        return !excludedAlbums.includes(track.album.id);
      }

      // If no albums are included or excluded, include the track
      return true;
    })
    /* Clean up track plays */
    .map(track => {
      // Remove track plays if they are by touched users
      const touchedUsers = new Set(filter.users.map(user => user.id));
      const filteredTrackPlays = track.TrackPlay.filter(play => touchedUsers.has(play.userId));
      return {
        ...track,
        TrackPlay: filteredTrackPlays,
      };
    })
    /* Add stats */
    .map(async (track) => {
      const totalPlays = track.TrackPlay.length;
      const totalMS = totalPlays * (track.duration || 0);

      const playsPerUser: Record<string, number> = {};
      track.TrackPlay.forEach(play => {
        playsPerUser[play.userId] = (playsPerUser[play.userId] || 0) + 1;
      });

      return {
        ...track,
        totalPlays,
        totalMS,
        playsPerUser,
        color: await getTrackBGColor(track.image || ""),
      }
    }))
    /* Await stats */
    .then((tracks) => (tracks as unknown as TrackWithStats[])
      /* Remove track plays */
      .map(track => {
        // @ts-expect-error - the types is technically wrong. It has more properties than TrackWithStats
        const { TrackPlay, ...trackWithoutPlays } = track;
        return trackWithoutPlays;
      })
      /* Sort */
      .sort(sortingFunctions[filter.sort]?.func || sortingFunctions[defaultFetchFilter.sort]?.func || sortingFunctions.play_count.func)
    );

  return filteredTracks;
}