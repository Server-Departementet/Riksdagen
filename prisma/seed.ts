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


const seedGenres = async (prisma: PrismaClient) => {
  console.debug("Seeding genres...");

  const remoteGenres = await remotePrisma.genre.findMany({
    select: {
      name: true,
    },
  });

  await prisma.genre.createMany({
    data: remoteGenres,
    skipDuplicates: true,
  });

  console.debug("Seeding genres complete.");
};

const seedAlbums = async (prisma: PrismaClient) => {
  console.debug("Seeding albums...");

  const remoteAlbums = await remotePrisma.album.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      url: true,
    },
  });

  await prisma.album.createMany({
    data: remoteAlbums,
    skipDuplicates: true,
  });

  const paginatedAlbums: string[] = [];
  for (let i = 0; i < remoteAlbums.length; i += 20) {
    const batch = remoteAlbums.slice(i, i + 20).map(album => album.id);
    paginatedAlbums.push(encodeURIComponent(batch.join(",")));
  }

  for (const batch of paginatedAlbums) {
    const response = await fetch(`https://api.spotify.com/v1/albums?ids=${batch}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch album data for album ID: ${batch}`);
      console.log(response);
      continue;
    }
    const data = await response.json() as SpotifyApi.MultipleAlbumsResponse;

    for (const album of data.albums) {
      const releaseDate = album.release_date;
      await prisma.album.update({
        where: { id: album.id },
        data: {
          releaseDate: new Date(releaseDate),
        },
      });
    }
  }

  console.debug("Seeding albums complete.");
};

const seedTracks = async (prisma: PrismaClient) => {
  console.debug("Seeding tracks...");

  const remoteTracks = await remotePrisma.track.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      duration: true,
      albumId: true,
    },
  });

  await prisma.track.createMany({
    data: remoteTracks.map(track => ({
      id: track.id,
      name: track.name,
      url: track.url,
      duration: track.duration,
      albumId: track.albumId,
    }) satisfies Prisma.TrackCreateManyInput),
    skipDuplicates: true,
  });

  // Get ISRCs separately from spotify API
  const paginatedTracks: string[] = [];
  for (let i = 0; i < remoteTracks.length; i += 50) {
    const batch = remoteTracks.slice(i, i + 50).map(track => track.id);
    paginatedTracks.push(encodeURIComponent(batch.join(",")));
  }

  for (const batch of paginatedTracks) {
    const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${batch}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch track data for track IDs: ${batch}`);
      continue;
    }
    const data = await response.json() as SpotifyApi.MultipleTracksResponse;

    for (const track of data.tracks) {
      const isrc = track.external_ids?.isrc;
      if (isrc) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            ISRC: isrc,
          },
        });
      }
    }
  }

  console.debug("Seeding tracks complete.");
};

const seedArtists = async (prisma: PrismaClient) => {
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

  for (const artist of remoteArtists) {
    const { genres, ...artistData } = artist;

    await prisma.artist.upsert({
      where: { id: artist.id },
      update: {
        ...artistData,
        genres: {
          connect: genres.map(genre => ({ name: genre.name })),
        },
        tracks: {
          connect: artist.tracks.map(track => ({ id: track.id })),
        },
      },
      create: {
        ...artistData,
        genres: {
          connect: genres.map(genre => ({ name: genre.name })),
        },
        tracks: {
          connect: artist.tracks.map(track => ({ id: track.id })),
        },
      },
    });
  }

  console.debug("Seeding artists complete.");
};

const seedTrackPlays = async (prisma: PrismaClient) => {
  console.debug("Seeding track plays...");

  const remoteTrackPlays = await remotePrisma.trackPlay.findMany();

  const users = await prisma.user.findMany();

  await prisma.trackPlay.createMany({
    data: remoteTrackPlays.map(tp => ({
      playedAt: tp.playedAt,
      userId: users.find(u => u.clerkDevId === tp.userId || u.clerkProdId === tp.userId)?.id
        ?? (() => { throw new Error("User not found for track play seeding"); })(),
      trackId: tp.trackId,
    }) satisfies Prisma.TrackPlayCreateManyInput),
    skipDuplicates: true,
  });

  console.debug("Seeding track plays complete.");
};

async function main() {
  console.info("Making users");
  execSync("yarn tsx scripts/make-users.ts");
  console.info("Finished making users");

  await prisma.$transaction(async (prisma) => {
    await seedGenres(prisma as PrismaClient);
    await seedAlbums(prisma as PrismaClient);
    await seedTracks(prisma as PrismaClient);
    await seedArtists(prisma as PrismaClient);
    await seedTrackPlays(prisma as PrismaClient);
  }, { timeout: 240_000 });
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