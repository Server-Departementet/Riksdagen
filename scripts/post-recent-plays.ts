import "dotenv/config";
import { extractImageColor } from "../src/functions/extract-image-color.ts";
import { Prisma, PrismaClient } from "../src/prisma/generated/client.js";
import { createClerkClient } from "@clerk/backend";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "node:process";

if (!env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is not set in environment variables");
}
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in environment variables");
}
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

addRecentTrackPlays()
  .then(() => {
    console.log("Finished adding recent track plays.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding recent track plays:", error);
    process.exit(1);
  });

async function addRecentTrackPlays() {
  const clerkClient = createClerkClient({
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: env.CLERK_SECRET_KEY!,
  });

  const dbURL = new URL(env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: dbURL.hostname,
    port: Number(dbURL.port),
    user: dbURL.username,
    password: dbURL.password,
    database: dbURL.pathname.slice(1),
  });
  const prisma = new PrismaClient({ adapter });

  const users = await clerkClient.users.getUserList();
  const ministers = users.data.filter((user) => user.publicMetadata?.role === "minister");

  for (const clerkUser of ministers) {
    /* 
     * Get spotify OAuth token for the user 
     */
    const tokenResponse = await clerkClient.users.getUserOauthAccessToken(clerkUser.id, "spotify");
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
    const recentlyPlayedTracks = await getRecentlyPlayedTracks(spotifyToken, clerkUser.firstName ?? "[Unknown user]");
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
      const color = await extractImageColor(url);
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
  const recentlyPlayedTracks = await recentlyPlayedTracksResponse.json() as SpotifyApi.UsersRecentlyPlayedTracksResponse;
  if (!recentlyPlayedTracks.items || recentlyPlayedTracks.items.length === 0) {
    console.warn(`No recently played tracks found for user: ${username}`);
    return null;
  }
  // Filter out local tracks
  recentlyPlayedTracks.items = recentlyPlayedTracks.items.filter((item) => !item.track.is_local);

  return recentlyPlayedTracks;
}