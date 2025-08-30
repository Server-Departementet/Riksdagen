/** 
 * This API endpoint gets called by the Spotify cron job running on an always-on server external to the Next.js app.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function generateDeterministicId(userId: string, track: SpotifyApi.TrackObjectFull, playedAt: string): string {
  const uniqueString = `${userId}:${track.id}:${playedAt}`;
  return createHash("md5").update(uniqueString).digest("hex");
}

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

const lastFetch: Date = new Date();
const fetchInterval = 60 * 1000; // 1 minute

export async function POST() {
  if (lastFetch && lastFetch > new Date(Date.now() - fetchInterval)) {
    console.warn("API already fetched recently. Skipping this run.");
    return NextResponse.json({
      message: "Already fetched recently. Skipping.",
    });
  }
  lastFetch.setTime(Date.now());

  const client = await clerkClient();
  const users = await client.users.getUserList();

  const ministers = users.data.filter((user) => user.publicMetadata?.role === "minister");

  for (const user of ministers) {
    try {
      const tokenResponse = await client.users.getUserOauthAccessToken(user.id, "spotify");

      if (!tokenResponse.data.length) {
        console.warn(`No Spotify token found for user: ${user.firstName}`);
        continue;
      }

      if (tokenResponse.data.length > 1) {
        console.warn(`Multiple Spotify tokens found for user: ${user.firstName}. Only using the first one.`);
      }

      const token = tokenResponse.data[0].token;

      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Error for user ${user.firstName}: Status ${response.status}`);
        console.error(`Response: ${await response.text()}`);
        continue;
      }

      const data: SpotifyApi.UsersRecentlyPlayedTracksResponse = await response.json();

      if (data.items && data.items.length > 0) {
        const trackPlaysDB: Set<string> = new Set(
          (
            await prisma.trackPlay.findMany({
              select: { id: true },
            })
          ).map((play) => play.id)
        );

        data.items = data.items.filter((item) => !item.track.is_local);

        data.items = data.items.map((item: SpotifyApi.PlayHistoryObject) => {
          return {
            ...item,
            track: {
              ...item.track,
              generatedId: generateDeterministicId(user.id, item.track, item.played_at),
            },
          }
        })
          .filter((item) => !trackPlaysDB.has(item.track.generatedId));

        for (const item of data.items) {
          try {
            const track = item.track;
            const playedAt = item.played_at;

            await storeTrackPlay(user.id, track, playedAt, token);
          } catch (error) {
            console.error(`Error storing track play for ${user.firstName}:`, error);
          }
        }
      } else {
        console.warn("No recently played tracks found.");
      }
    } catch (error) {
      console.error(`Error processing user ${user.firstName}:`, error);
    }
  }

  return NextResponse.json({
    message: "200 OK",
  });
}
