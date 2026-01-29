// @ts-check

import "dotenv/config";
import { Prisma, PrismaClient } from "../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { execSync } from "node:child_process";
import { createClerkClient } from "@clerk/backend";
import { env } from "node:process";

const dbURL = process.env.DATABASE_URL;
if (!dbURL) throw new Error("DATABASE_URL environment variable is not set");
const adapter = new PrismaMariaDb({
  host: new URL(dbURL).hostname,
  port: Number(new URL(dbURL).port),
  user: new URL(dbURL).username,
  password: new URL(dbURL).password,
  database: new URL(dbURL).pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

const remoteDB = process.env.REMOTE_DB_URL;
if (!remoteDB) throw new Error("REMOTE_DB_URL environment variable is not set");
const remoteAdapter = new PrismaMariaDb({
  host: new URL(remoteDB).hostname,
  port: Number(new URL(remoteDB).port),
  user: new URL(remoteDB).username,
  password: new URL(remoteDB).password,
  database: new URL(remoteDB).pathname.slice(1),
});
const remotePrisma = new PrismaClient({ adapter: remoteAdapter });

const clerkClient = createClerkClient({
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  secretKey: env.CLERK_SECRET_KEY!,
});
const users = await clerkClient.users.getUserList();
const ministers = users.data.filter((user) => user.publicMetadata?.role === "minister");

const tokenResponse = await clerkClient.users.getUserOauthAccessToken(ministers[0].id, "spotify");
if (!tokenResponse.data.length) {
  throw new Error(`No Spotify token found for user: ${ministers[0].firstName}`);
}
if (tokenResponse.data.length > 1) {
  throw new Error(`Multiple Spotify tokens found for user: ${ministers[0].firstName}`);
}
const spotifyToken = tokenResponse.data[0].token;

const toPositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const TRANSACTION_TIMEOUT_MS = 240_000;
const SPOTIFY_FETCH_CONCURRENCY = toPositiveInteger(env.SEED_SPOTIFY_FETCH_CONCURRENCY, 5);
const DB_WRITE_CONCURRENCY = toPositiveInteger(env.SEED_DB_WRITE_CONCURRENCY, 25);

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) throw new Error("Chunk size must be greater than zero");
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<void>,
) => {
  if (concurrency <= 0) throw new Error("Concurrency must be greater than zero");
  if (!items.length) return;
  let currentIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        await handler(items[index]!, index);
      }
    },
  );
  await Promise.all(workers);
};

const runInTransaction = async (
  label: string,
  action: (tx: Prisma.TransactionClient) => Promise<void>,
) => {
  console.info(`[${label}] Starting transaction`);
  await prisma.$transaction(async (tx) => action(tx), { timeout: TRANSACTION_TIMEOUT_MS });
  console.info(`[${label}] Transaction committed`);
};

type TrackSeedPayload = {
  id: string;
  name: string;
  url: string;
  duration: number;
  albumId: string;
  ISRC?: string;
};

const seedGenres = async () => {
  console.debug("Seeding genres...");

  const remoteGenres = await remotePrisma.genre.findMany({
    select: {
      name: true,
    },
  });

  await runInTransaction("genres", async (tx) => {
    await tx.genre.createMany({
      data: remoteGenres,
      skipDuplicates: true,
    });
  });

  console.debug("Seeding genres complete.");
};

const seedAlbums = async () => {
  console.debug("Seeding albums...");

  const remoteAlbums = await remotePrisma.album.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      url: true,
    },
  });

  const albumIdChunks = chunkArray(remoteAlbums.map(album => album.id), 20);
  const albumRequests = albumIdChunks.map(ids => ({
    encodedIds: encodeURIComponent(ids.join(",")),
    rawIds: ids,
  }));

  const releaseDates = new Map<string, Date>();
  await runWithConcurrency(albumRequests, SPOTIFY_FETCH_CONCURRENCY, async ({ encodedIds, rawIds }) => {
    const response = await fetch(`https://api.spotify.com/v1/albums?ids=${encodedIds}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch album data for album IDs: ${rawIds.join(",")}`);
      return;
    }
    const data = await response.json() as SpotifyApi.MultipleAlbumsResponse;

    for (const album of data.albums ?? []) {
      if (!album?.release_date) continue;
      releaseDates.set(album.id, new Date(album.release_date));
    }
  });

  await runInTransaction("albums", async (tx) => {
    await tx.album.createMany({
      data: remoteAlbums,
      skipDuplicates: true,
    });

    const releaseEntries = Array.from(releaseDates.entries());
    await runWithConcurrency(releaseEntries, DB_WRITE_CONCURRENCY, async ([albumId, releaseDate]) => {
      await tx.album.update({
        where: { id: albumId },
        data: { releaseDate },
      });
    });
  });

  console.debug("Seeding albums complete.");
};

const seedTracks = async () => {
  console.debug("Seeding tracks...");

  const remoteTrackIds = await remotePrisma.track.findMany({
    select: {
      id: true,
    },
  });

  const trackIdChunks = chunkArray(remoteTrackIds.map(track => track.id), 50);
  const trackRequests = trackIdChunks.map(ids => ({
    encodedIds: encodeURIComponent(ids.join(",")),
    rawIds: ids,
  }));

  const trackPayloads: TrackSeedPayload[] = [];

  await runWithConcurrency(trackRequests, SPOTIFY_FETCH_CONCURRENCY, async ({ encodedIds, rawIds }) => {
    const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${encodedIds}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch track data for track IDs: ${rawIds.join(",")}`);
      return;
    }
    const data = await response.json() as SpotifyApi.MultipleTracksResponse;

    for (const track of data.tracks ?? []) {
      if (!track) continue;
      const ISRC = track.external_ids?.isrc ?? undefined;
      if (!ISRC) {
        console.warn(`No ISRC found for track ID: ${track.id}`);
      }

      trackPayloads.push({
        id: track.id,
        name: track.name,
        url: track.external_urls.spotify,
        duration: track.duration_ms,
        albumId: track.album.id,
        ISRC,
      });
    }
  });

  await runInTransaction("tracks", async (tx) => {
    await runWithConcurrency(trackPayloads, DB_WRITE_CONCURRENCY, async (trackData) => {
      if (!trackData.ISRC) {
        console.warn(`Skipping track without ISRC: ${trackData.id} - ${trackData.name}`);
        return;
      }
      const payload = {
        id: trackData.id,
        name: trackData.name,
        url: trackData.url,
        duration: trackData.duration,
        album: { connect: { id: trackData.albumId } },
        ISRC: trackData.ISRC,
      } satisfies Prisma.TrackCreateInput;

      await tx.track.upsert({
        where: { id: trackData.id },
        update: payload,
        create: payload,
      });
    });
  });

  console.debug("Seeding tracks complete.");
};

const seedArtists = async () => {
  console.debug("Seeding artists...");

  const remoteArtists = await remotePrisma.artist.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      url: true,
      genres: {
        select: {
          name: true,
        },
      },
      tracks: {
        select: {
          id: true,
        }
      }
    },
  });

  await runInTransaction("artists", async (tx) => {
    await runWithConcurrency(remoteArtists, DB_WRITE_CONCURRENCY, async (artist) => {
      const { genres, tracks, ...artistData } = artist;
      const genreConnections = genres.map(genre => ({ name: genre.name }));
      const trackConnections = tracks.map(track => ({ id: track.id }));
      const genrePayload = genreConnections.length ? { genres: { connect: genreConnections } } : {};
      const trackPayload = trackConnections.length ? { tracks: { connect: trackConnections } } : {};

      await tx.artist.upsert({
        where: { id: artist.id },
        update: {
          ...artistData,
          ...genrePayload,
          ...trackPayload,
        },
        create: {
          ...artistData,
          ...genrePayload,
          ...trackPayload,
        },
      });
    });
  });

  console.debug("Seeding artists complete.");
};

const seedTrackPlays = async () => {
  console.debug("Seeding track plays...");

  const remoteTrackPlays = await remotePrisma.trackPlay.findMany();

  await runInTransaction("trackPlays", async (tx) => {
    const users = await tx.user.findMany({
      select: {
        id: true,
        clerkDevId: true,
        clerkProdId: true,
      },
    });

    const clerkToUserId = new Map<string, string>();
    for (const user of users) {
      if (user.clerkDevId) clerkToUserId.set(user.clerkDevId, user.id);
      if (user.clerkProdId) clerkToUserId.set(user.clerkProdId, user.id);
    }

    const trackPlayData = remoteTrackPlays.map(tp => {
      const userId = clerkToUserId.get(tp.userId);
      if (!userId) {
        throw new Error(`User not found for track play seeding (remote ID: ${tp.userId})`);
      }
      return {
        playedAt: tp.playedAt,
        userId,
        trackId: tp.trackId,
      } satisfies Prisma.TrackPlayCreateManyInput;
    });

    await tx.trackPlay.createMany({
      data: trackPlayData,
      skipDuplicates: true,
    });
  });

  console.debug("Seeding track plays complete.");
};

async function main() {
  console.info("Making users");
  execSync("yarn tsx scripts/make-users.ts");
  console.info("Finished making users");

  await seedGenres();
  await seedAlbums();
  await seedTracks();
  await seedArtists();
  await seedTrackPlays();
}

main()
  .then(() => {
    console.debug("Seeding completed successfully.");
    process.exitCode = 0;
  })
  .catch(error => {
    console.error("Error during seeding:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await remotePrisma.$disconnect();
  });