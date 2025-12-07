import "dotenv/config";
import { PrismaClient } from "../src/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

  await prisma.album.createMany({
    data: remoteAlbums,
    skipDuplicates: true,
  });

  console.debug("Seeding albums complete.");
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
      },
      create: {
        ...artistData,
        genres: {
          connect: genres.map(genre => ({ name: genre.name })),
        },
      },
    });
  }

  console.debug("Seeding artists complete.");
};

const seedGenres = async () => {
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

const seedTracks = async () => {
  console.debug("Seeding tracks...");

  const remoteTracks = await remotePrisma.track.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      url: true,
      duration: true,
      albumId: true,
      artists: {
        select: {
          id: true,
        },
      },
    },
  });

  // Create each track with its artist relationships
  for (const track of remoteTracks) {
    const { artists, ...trackData } = track;

    await prisma.track.upsert({
      where: { id: track.id },
      update: {
        ...trackData,
        artists: {
          connect: artists.map(artist => ({ id: artist.id })),
        },
      },
      create: {
        ...trackData,
        artists: {
          connect: artists.map(artist => ({ id: artist.id })),
        },
      },
    });
  }

  console.debug("Seeding tracks complete.");
};

const seedTrackPlays = async () => {
  console.debug("Seeding track plays...");

  const remoteTrackPlays = await remotePrisma.trackPlay.findMany({
    select: {
      id: true,
      playedAt: true,
      trackId: true,
      userId: true,
    },
  });

  await prisma.trackPlay.createMany({
    data: remoteTrackPlays,
    skipDuplicates: true,
  });

  console.debug("Seeding track plays complete.");
};

async function main() {
  await seedAlbums();
  await seedGenres();
  await seedArtists();
  await seedTracks();
  await seedTrackPlays();
}

main()
  .then(() => {
    console.debug("Seeding completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error during seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await remotePrisma.$disconnect();
  });