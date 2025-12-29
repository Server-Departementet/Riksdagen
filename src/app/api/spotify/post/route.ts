"use server";

/** 
 * This API endpoint gets called by the Spotify cron job running on an always-on server external to the Next.js app.
*/

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/client";

const lastFetch: Date = new Date();
const fetchInterval = 60 * 1000; // 1 minute

export async function POST() {
  if (lastFetch && lastFetch > new Date(Date.now() - fetchInterval)) {
    console.warn("API already fetched recently. Skipping this run.");
    return NextResponse.json({ message: "Too Many Requests", }, { status: 429 });
  }
  lastFetch.setTime(Date.now());

  const client = await clerkClient();
  const users = await client.users.getUserList();

  const ministers = users.data.filter((user) => user.publicMetadata?.role === "minister");

  for (const clerkUser of ministers) {
    /* 
     * Get spotify OAuth token for the user 
     */
    const tokenResponse = await client.users.getUserOauthAccessToken(clerkUser.id, "spotify");
    if (!tokenResponse.data.length) {
      console.warn(`No Spotify token found for user: ${clerkUser.firstName}`);
      continue;
    }
    if (tokenResponse.data.length > 1) {
      console.warn(`Multiple Spotify tokens found for user: ${clerkUser.firstName}. Only using the first one.`);
    }
    const spotifyToken = tokenResponse.data[0].token;

    /* 
     * Ensure user is in our database 
     */
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkDevId: clerkUser.id, },
          { clerkProdId: clerkUser.id, },
          // It should only be one of the above but in migration clerk ids may have been dumped as User.id  TODO remove
          { id: clerkUser.id, },
        ],
      },
    });
    if (!dbUser) {
      console.warn(`User ${clerkUser.firstName} not found in database. Skipping.`);
      continue;
    }

    /* 
     * Get recently played tracks from Spotify API 
     */
    const recentlyPlayedTracksResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });
    if (!recentlyPlayedTracksResponse.ok) {
      console.error(`Error for user ${clerkUser.firstName}: Status ${recentlyPlayedTracksResponse.status} Response: ${await recentlyPlayedTracksResponse.text()}`);
      continue;
    }
    const recentlyPlayedTracks: SpotifyApi.UsersRecentlyPlayedTracksResponse = await recentlyPlayedTracksResponse.json();
    if (!recentlyPlayedTracks.items || recentlyPlayedTracks.items.length === 0) {
      console.warn(`No recently played tracks found for user: ${clerkUser.firstName}`);
      continue;
    }

    /* 
     * Ensure all tracks, albums, artists, genres are in our database 
     */
    // for (const trackPlay of recentlyPlayedTracks.items) {
    //   const missingTracks = await prisma.track.findUnique({
    // }
    const missingTrackIds = await prisma.track.findMany({
      where: {
        id: { in: recentlyPlayedTracks.items.map((item) => item.track.id) },
      },
      select: { id: true },
    });
    const missingAlbumIds = await prisma.album.findMany({
      where: {
        id: { in: recentlyPlayedTracks.items.map((item) => item.track.album.id) },
      },
      select: { id: true },
    });
    const missingArtistIds = await prisma.artist.findMany({
      where: {
        id: { in: recentlyPlayedTracks.items.flatMap((item) => item.track.artists.map((artist) => artist.id)) },
      },
      select: { id: true },
    });
    /** 
     * FETCH ARTISTS!
     */

    // const missingGenreNames = await prisma.genre.findMany({
    //   where: {
    //     name: { in: recentlyPlayedTracks.items.flatMap((item) => item.track.artists).flatMap((artist) => artist.genres || []) },
    //   },
    //   select: { name: true },
    // });
    // const addedArtists = await prisma.artist.createMany({
    //   data: recentlyPlayedTracks.items
    //     .flatMap((item) => item.track.artists)
    //     .filter((artist) => !missingArtistIds.find((a) => a.id === artist.id))
    //     .map((artist) => ({
    //       id: artist.id,
    //       name: artist.name,
    //       url: artist.external_urls.spotify,
    //     } satisfies Prisma.ArtistCreateManyInput)),
    //   skipDuplicates: true,
    // });
    const addedTracks = await prisma.track.createMany({
      data: recentlyPlayedTracks.items
        .filter((item) => !missingTrackIds.find((t) => t.id === item.track.id))
        .map((item) => ({
          id: item.track.id,
          name: item.track.name,
          duration: item.track.duration_ms,
          url: item.track.external_urls.spotify,
          albumId: item.track.album.id,
        } satisfies Prisma.TrackCreateManyInput)),
      skipDuplicates: true,
    });


    /* 
     * Process and store each fetched track play
     */
    const trackPlays = await prisma.trackPlay.createMany({
      data: recentlyPlayedTracks.items.map((item) => ({
        userId: dbUser.id,
        trackId: item.track.id,
        playedAt: new Date(item.played_at),
      } satisfies Prisma.TrackPlayCreateManyInput)),
      skipDuplicates: true,
    });

    return NextResponse.json({ message: "200 OK" }, { status: 200 });
  }
}


// if (data.items && data.items.length > 0) {
//   const trackPlaysDB: Set<string> = new Set(
//     (
//       await prisma.trackPlay.findMany({
//         select: { id: true },
//       })
//     ).map((play) => play.id)
//   );

//   data.items = data.items.filter((item) => !item.track.is_local);

//   data.items = data.items.map((item: SpotifyApi.PlayHistoryObject) => {
//     return {
//       ...item,
//       track: {
//         ...item.track,
//         generatedId: generateDeterministicId(user.id, item.track, item.played_at),
//       },
//     }
//   })
//     .filter((item) => !trackPlaysDB.has(item.track.generatedId));

//   for (const item of data.items) {
//     try {
//       const track = item.track;
//       const playedAt = item.played_at;

//       await storeTrackPlay(user.id, track, playedAt, token);
//     } catch (error) {
//       console.error(`Error storing track play for ${user.firstName}:`, error);
//     }
//   }
// } else {
//   console.warn("No recently played tracks found.");
// }

async function storeTrackPlay(userId: string, track: SpotifyApi.TrackObjectFull, playedAt: string, token: string) {
  // Generate a deterministic ID using userId, track.id, and playedAt timestamp.
  const deterministicId = generateDeterministicId(userId, track, playedAt);

  // Upsert the Album for the track.
  await prisma.album.upsert({
    where: { id: track.album.id },
    update: {
      name: track.album.name,
      url: track.album.external_urls.spotify,
      image: track.album.images[0]?.url || null,
    },
    create: {
      id: track.album.id,
      name: track.album.name,
      url: track.album.external_urls.spotify,
      image: track.album.images[0]?.url || null,
    },
  });

  // Check database for existing artists.
  const existingArtists = new Set(
    (
      await prisma.artist.findMany({
        where: {
          id: { in: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => artist.id) },
        },
        select: { id: true },
      })
    ).map((artist) => artist.id)
  );

  // Upsert each Artist and handle Genre connections.
  for (const artist of track.artists.filter((artist) => !existingArtists.has(artist.id))) {
    // Fetch artist details from Spotify API.
    const response = await fetch(artist.href, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Error fetching artist details for ${artist.name}: Status ${response.status}`);
      console.error(`Response: ${await response.text()}`);
      continue;
    }

    const data: SpotifyApi.SingleArtistResponse = await response.json();

    const genres: string[] = data.genres;

    const genreConnect = genres.map((genre: string) => ({ name: genre }));

    // Upsert Genre entries for the artist.
    for (const genre of genres) {
      await prisma.genre.upsert({
        where: { name: genre },
        update: {},
        create: { name: genre },
      });
    }

    await prisma.artist.upsert({
      where: { id: artist.id },
      update: {
        name: artist.name,
        url: artist.external_urls.spotify,
        image: data.images[0]?.url || null,
        genres: { set: genreConnect },
      },
      create: {
        id: artist.id,
        name: artist.name,
        url: artist.external_urls.spotify,
        image: data.images[0]?.url || null,
        genres: { connect: genreConnect },
      },
    });
  }

  // Upsert Track, and connect the artists that have been upserted.
  await prisma.track.upsert({
    where: { id: track.id },
    update: {
      name: track.name,
      duration: track.duration_ms,
      url: track.external_urls.spotify,
      image: track.album.images[0]?.url || null,
      albumId: track.album.id,
      // Connect artists using their ids.
      artists: {
        set: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({ id: artist.id })),
      },
    },
    create: {
      id: track.id,
      name: track.name,
      duration: track.duration_ms,
      url: track.external_urls.spotify,
      image: track.album.images[0]?.url || null,
      albumId: track.album.id,
      artists: {
        connect: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({ id: artist.id })),
      },
    },
  });

  // Finally, upsert the TrackPlay entry referencing the track.
  await prisma.trackPlay.upsert({
    where: { id: deterministicId },
    update: {},
    create: {
      id: deterministicId,
      trackId: track.id,
      userId: userId,
      playedAt: new Date(playedAt),
    },
  });
}