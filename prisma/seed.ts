// @ts-check

import "dotenv/config";
import { Prisma, PrismaClient } from "../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { execSync } from "node:child_process";

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
  }, { timeout: 20000 });
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