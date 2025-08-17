import { PrismaClient } from "../src/prisma/client";

const prisma = new PrismaClient();

const remoteDB = process.env.REMOTE_DB_URL;
const remotePrisma = new PrismaClient({ datasourceUrl: remoteDB });

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


await seedAlbums();
await seedGenres();
await seedArtists();
await seedTracks();
await seedTrackPlays();