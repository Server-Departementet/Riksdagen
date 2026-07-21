import "dotenv/config";
import type { Prisma } from "@/lib/prisma/generated";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "@/lib/prisma";
import { refreshSpotifyAccessToken } from "./spotify-auth";
import type SpotifyApi from "spotify-web-api-node";

const {
  DATABASE_URL,
  REMOTE_DB_URL,
} = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL environment variable is not set");
if (!REMOTE_DB_URL) throw new Error("REMOTE_DB_URL environment variable is not set");

const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));
const remotePrisma = new PrismaClient(makeMariaDBAdapter(REMOTE_DB_URL));

// Borrow a connected minister's Spotify account (from the remote DB) to fetch public catalog data
const spotifyAccount = await remotePrisma.spotifyAccount.findFirst();
if (!spotifyAccount) {
  throw new Error("No connected Spotify account found in the remote database");
}
const refreshed = await refreshSpotifyAccessToken(spotifyAccount.refreshToken);
if (!refreshed) {
  throw new Error(`Could not refresh Spotify token for user ${spotifyAccount.userId}`);
}
if (refreshed.newRefreshToken) {
  await remotePrisma.spotifyAccount.update({
    where: { userId: spotifyAccount.userId },
    data: { refreshToken: refreshed.newRefreshToken },
  });
}
const spotifyToken = refreshed.accessToken;

const toPositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const TRANSACTION_TIMEOUT_MS = 240_000;
const SPOTIFY_FETCH_CONCURRENCY = toPositiveInteger(process.env.SEED_SPOTIFY_FETCH_CONCURRENCY, 5);
const DB_WRITE_CONCURRENCY = toPositiveInteger(process.env.SEED_DB_WRITE_CONCURRENCY, 25);

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
        const current = items[index];
        if (!current) continue;
        await handler(current, index);
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
        },
      },
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
      },
    });
    const userIds = new Set(users.map(u => u.id));

    const trackPlayData = remoteTrackPlays.map(tp => {
      if (!userIds.has(tp.userId)) {
        throw new Error(`User not found for track play seeding (remote ID: ${tp.userId})`);
      }
      return {
        playedAt: tp.playedAt,
        userId: tp.userId,
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

const seedUsers = async () => {
  console.debug("Seeding users...");

  const remoteUsers = await remotePrisma.user.findMany();

  await runInTransaction("users", async (tx) => {
    for (const user of remoteUsers) {
      await tx.user.upsert({
        where: { id: user.id },
        create: user,
        update: user,
      });
    }
  });

  console.debug("Seeding users complete.");
};

async function main() {
  await seedUsers();
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
  .catch((err: unknown) => {
    console.error("Error during seeding:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await remotePrisma.$disconnect();
  });