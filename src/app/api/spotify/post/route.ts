"use server";

/** 
 * This API endpoint gets called by the Spotify cron job running on an always-on server external to the Next.js app.
*/

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@/prisma/client";
import { getTrackBGColor } from "@/app/spotify/functions/get-track-color";

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
    const recentlyPlayedTracks = await getRecentlyPlayedTracks(spotifyToken, clerkUser.firstName || "[Unknown user]");
    if (!recentlyPlayedTracks) {
      continue;
    }

    /* 
     * Prepare data for upserting to database
     */
    const existingArtistIds = await prisma.artist.findMany({ select: { id: true }, });
    const missingArtistsSimple = recentlyPlayedTracks.items
      .flatMap((item) => item.track.artists)
      .filter((artist) => !existingArtistIds.find((a) => a.id === artist.id));
    const artists = await getSpotifyArtists(missingArtistsSimple, spotifyToken);
    const genres = artists.flatMap((artist) => artist.genres);
    const albums = recentlyPlayedTracks.items.map((item) => item.track.album);
    const tracks = recentlyPlayedTracks.items.map((item) => item.track);

    // Colors
    const colors: Record<string, string> = {};
    const allImageUrls = [
      ...artists.map((artist) => artist.images[0]?.url).filter((url): url is string => !!url),
      ...albums.map((album) => album.images[0]?.url).filter((url): url is string => !!url),
    ];
    await Promise.all(allImageUrls.map(async (url) => {
      if (colors[url]) return;
      const color = await getTrackBGColor(url);
      if (!color) return;
      colors[url] = color;
    }));

    /* 
     * Write Genres, Artists, Albums, Tracks and TrackPlays to database
     */
    await prisma.$transaction(async (prisma) => {
      // Insert Genres, skip dupes
      await prisma.genre.createMany({
        skipDuplicates: true,
        data: [
          ...genres.map((genre) => ({ name: genre }))
        ] satisfies Prisma.GenreCreateManyInput[],
      });

      // Upsert Albums
      for (const album of albums) {
        const imageUrl = album.images[0]?.url || null;
        await prisma.album.upsert({
          where: { id: album.id },
          update: {
            name: album.name,
            url: album.external_urls.spotify,
            image: imageUrl,
            color: imageUrl ? colors[imageUrl] : undefined,
            tracks: {
              connect: tracks
                .filter((track) => track.album.id === album.id)
                .map((track) => ({ id: track.id })),
            },
          },
          create: {
            id: album.id,
            name: album.name,
            url: album.external_urls.spotify,
            image: imageUrl,
            color: imageUrl ? colors[imageUrl] : undefined,
            tracks: {
              connect: tracks
                .filter((track) => track.album.id === album.id)
                .map((track) => ({ id: track.id })),
            },
          },
        });
      }

      // Upsert tracks
      for (const track of tracks) {
        await prisma.track.upsert({
          where: { id: track.id },
          update: {
            name: track.name,
            url: track.external_urls.spotify,
            duration: track.duration_ms,
            albumId: track.album.id,
          },
          create: {
            id: track.id,
            name: track.name,
            url: track.external_urls.spotify,
            duration: track.duration_ms,
            albumId: track.album.id,
          },
        });
      }

      // Upsert Artists
      for (const artist of artists) {
        const imageUrl = artist.images[0]?.url || null;
        await prisma.artist.upsert({
          where: { id: artist.id },
          update: {
            name: artist.name,
            url: artist.external_urls.spotify,
            image: imageUrl,
            color: imageUrl ? colors[imageUrl] : undefined,
            genres: {
              connect: artist.genres.map((genre) => ({ name: genre })),
            },
            tracks: {
              connect: tracks
                .filter((track) => track.artists.some((a) => a.id === artist.id))
                .map((track) => ({ id: track.id })),
            },
          },
          create: {
            id: artist.id,
            name: artist.name,
            url: artist.external_urls.spotify,
            image: imageUrl,
            color: imageUrl ? colors[imageUrl] : undefined,
            genres: {
              connect: artist.genres.map((genre) => ({ name: genre })),
            },
            tracks: {
              connect: tracks
                .filter((track) => track.artists.some((a) => a.id === artist.id))
                .map((track) => ({ id: track.id })),
            },
          },
        });
      }

      // Insert TrackPlays, skip dupes
      await prisma.trackPlay.createMany({
        skipDuplicates: true,
        data: recentlyPlayedTracks.items.map((item) => ({
          playedAt: new Date(item.played_at),
          userId: dbUser.id,
          trackId: item.track.id,
        })) satisfies Prisma.TrackPlayCreateManyInput[],
      });
    })
      .catch((error) => {
        console.error(`Error upserting data for user ${clerkUser.firstName}:`, error);
      });
  }

  return NextResponse.json({ message: "200 OK" }, { status: 200 });
}

async function getSpotifyArtists(artistsSimple: SpotifyApi.ArtistObjectSimplified[], token: string): Promise<SpotifyApi.ArtistObjectFull[]> {
  const artistDetails: SpotifyApi.ArtistObjectFull[] = [];

  for (const artist of artistsSimple) {
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
    artistDetails.push(data);
  }

  return artistDetails;
}

async function getRecentlyPlayedTracks(token: string, username: string): Promise<SpotifyApi.UsersRecentlyPlayedTracksResponse | null> {
  const recentlyPlayedTracksResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!recentlyPlayedTracksResponse.ok) {
    console.error(`Error for user ${username}: Status ${recentlyPlayedTracksResponse.status} Response: ${await recentlyPlayedTracksResponse.text()}`);
    return null;
  }
  const recentlyPlayedTracks: SpotifyApi.UsersRecentlyPlayedTracksResponse = await recentlyPlayedTracksResponse.json();
  if (!recentlyPlayedTracks.items || recentlyPlayedTracks.items.length === 0) {
    console.warn(`No recently played tracks found for user: ${username}`);
    return null;
  }
  // Filter out local tracks
  recentlyPlayedTracks.items = recentlyPlayedTracks.items.filter((item) => !item.track.is_local);

  return recentlyPlayedTracks;
}