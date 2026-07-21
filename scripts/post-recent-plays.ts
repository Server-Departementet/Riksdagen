import "dotenv/config";
import { extractImageColor } from "@/functions/extract-image-color";
import type { Prisma } from "@/lib/prisma/generated";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "../src/lib/prisma/mariadb-adapter";
import { refreshSpotifyAccessToken } from "./spotify-auth";
import type SpotifyApi from "spotify-web-api-node";
import type { UsersRecentlyPlayedTracksResponse } from "./types";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const DATABASE_URL = process.env.DATABASE_URL;

addRecentTrackPlays()
  .then(() => {
    console.log("Finished adding recent track plays.");
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error("Error adding recent track plays:", err);
    process.exit(1);
  });

async function addRecentTrackPlays() {
  console.info("Starting recent track plays import.");

  const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

  try {
    console.info("Fetching connected Spotify accounts.");
    const spotifyAccounts = await prisma.spotifyAccount.findMany({ include: { user: true } });
    console.info(`Found ${spotifyAccounts.length} connected Spotify accounts.`);

    for (const account of spotifyAccounts) {
      const dbUser = account.user;
      const username = dbUser.name ?? dbUser.id;
      console.info(`Processing user: ${username} (${dbUser.id}).`);

      /*
       * Get a fresh spotify access token for the user
       */
      const refreshed = await refreshSpotifyAccessToken(account.refreshToken);
      if (!refreshed) {
        console.warn(`Could not refresh Spotify token for user: ${username}. They may need to reconnect at /spotify.`);
        continue;
      }
      if (refreshed.newRefreshToken) {
        await prisma.spotifyAccount.update({
          where: { userId: dbUser.id },
          data: { refreshToken: refreshed.newRefreshToken },
        });
      }
      const spotifyToken = refreshed.accessToken;
      console.info(`Spotify token resolved for ${username}.`);

      /*
       * Get recently played tracks from Spotify API
       */
      const recentlyPlayedTracks = await getRecentlyPlayedTracks(spotifyToken, username);
      if (!recentlyPlayedTracks) {
        continue;
      }
      console.info(`Fetched ${recentlyPlayedTracks.items.length} recent plays for ${username}.`);

      /* 
       * Prepare data for upserting to database
       */
      const existingArtistIds = await prisma.artist.findMany({ select: { id: true } });
      const missingArtistsSimple = recentlyPlayedTracks.items
        .flatMap((item) => item.track.artists as SpotifyApi.ArtistObjectSimplified[])
        .filter((artist) => !existingArtistIds.find((a) => a.id === artist.id));
      console.info(`Missing artists to fetch: ${missingArtistsSimple.length}.`);
      const artists = await getSpotifyArtists(missingArtistsSimple, spotifyToken);
      const genres = artists.flatMap((artist) => artist.genres);
      const albums = recentlyPlayedTracks.items.map((item) => item.track.album);
      const tracks = recentlyPlayedTracks.items.map((item) => item.track);
      console.info(`Prepared ${artists.length} artists, ${albums.length} albums, ${tracks.length} tracks, ${genres.length} genres.`);

      // Colors
      const colors: Record<string, string> = {};
      const allImageUrls = [
        ...artists.map((artist) => artist.images[0]?.url).filter((url): url is string => !!url),
        ...albums.map((album) => album.images[0]?.url).filter((url): url is string => !!url),
      ];
      await Promise.all(allImageUrls.map(async (url) => {
        if (colors[url]) return;
        const color = await extractImageColor(url);
        if (!color) return;
        colors[url] = color;
      }));
      console.info(`Resolved ${Object.keys(colors).length} image colors.`);

      /* 
       * Write Genres, Artists, Albums, Tracks and TrackPlays to database
       */
      await prisma.$transaction(async (prisma) => {
        console.info(`Writing data for ${username} in a transaction.`);
        // Insert Genres, skip dupes
        await prisma.genre.createMany({
          skipDuplicates: true,
          data: [
            ...genres.map((genre) => ({ name: genre })),
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
              releaseDate: new Date(album.release_date),
            },
            create: {
              id: album.id,
              name: album.name,
              url: album.external_urls.spotify,
              image: imageUrl,
              color: imageUrl ? colors[imageUrl] : undefined,
              releaseDate: new Date(album.release_date),
            },
          });
        }

        // Upsert tracks
        for (const track of tracks) {
          const ISRC = track.external_ids.isrc;
          if (!ISRC) {
            console.warn(`No ISRC found for track ${track.name} (${track.id}). Skipping.`);
            continue;
          }

          await prisma.track.upsert({
            where: { id: track.id },
            update: {
              name: track.name,
              url: track.external_urls.spotify,
              duration: track.duration_ms,
              albumId: track.album.id,
              ISRC,
            },
            create: {
              id: track.id,
              name: track.name,
              url: track.external_urls.spotify,
              duration: track.duration_ms,
              albumId: track.album.id,
              ISRC,
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

        // Really ensure Track-Artist relations
        for (const track of tracks) {
          for (const artist of track.artists) {
            await prisma.track.update({
              where: { id: track.id },
              data: { artists: { connect: { id: artist.id } } },
            });
          }
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
        console.info(`Inserted ${recentlyPlayedTracks.items.length} track plays (duplicates skipped).`);
      })
        .catch((err: unknown) => {
          console.error(`Error upserting data for user ${username}:`, err);
        });
    }
  } finally {
    console.info("Disconnecting Prisma.");
    await prisma.$disconnect();
  }

  return;
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

    const data = await response.json() as SpotifyApi.SingleArtistResponse;
    artistDetails.push(data);
  }

  return artistDetails;
}

async function getRecentlyPlayedTracks(token: string, username: string): Promise<UsersRecentlyPlayedTracksResponse | null> {
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
  const recentlyPlayedTracks = await recentlyPlayedTracksResponse.json() as UsersRecentlyPlayedTracksResponse;
  if (!recentlyPlayedTracks.items || recentlyPlayedTracks.items.length === 0) {
    console.warn(`No recently played tracks found for user: ${username}`);
    return null;
  }
  // Filter out local tracks
  recentlyPlayedTracks.items = recentlyPlayedTracks.items.filter((item) => !item.track.is_local);

  return recentlyPlayedTracks;
}