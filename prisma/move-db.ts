import { PrismaClient } from "./generated-postgres/client/client.js";
import { PrismaClient as RemotePrismaClient } from "./generated-postgres/client/client.js";


/** 
 * Basically just the seed script but for moving data from the old postgres database to mariadb.
 */


const prisma = new PrismaClient();

const remoteDB = process.env.REMOTE_DB_URL;
const remotePrisma = new RemotePrismaClient({ datasourceUrl: remoteDB });


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

  console.debug(`Found ${remoteAlbums.length} albums to migrate`);

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

  console.debug(`Found ${remoteArtists.length} artists to migrate`);

  // Process in batches to avoid memory issues with large datasets
  const batchSize = 100;
  for (let i = 0; i < remoteArtists.length; i += batchSize) {
    const batch = remoteArtists.slice(i, i + batchSize);

    for (const artist of batch) {
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

    console.debug(`Processed ${Math.min(i + batchSize, remoteArtists.length)}/${remoteArtists.length} artists`);
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

  console.debug(`Found ${remoteGenres.length} genres to migrate`);

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

  console.debug(`Found ${remoteTracks.length} tracks to migrate`);

  // Process in batches for better performance
  const batchSize = 100;
  for (let i = 0; i < remoteTracks.length; i += batchSize) {
    const batch = remoteTracks.slice(i, i + batchSize);

    for (const track of batch) {
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

    console.debug(`Processed ${Math.min(i + batchSize, remoteTracks.length)}/${remoteTracks.length} tracks`);
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

  console.debug(`Found ${remoteTrackPlays.length} track plays to migrate`);

  // Process in larger batches since these are simpler records
  const batchSize = 1000;
  for (let i = 0; i < remoteTrackPlays.length; i += batchSize) {
    const batch = remoteTrackPlays.slice(i, i + batchSize);

    await prisma.trackPlay.createMany({
      data: batch,
      skipDuplicates: true,
    });

    console.debug(`Processed ${Math.min(i + batchSize, remoteTrackPlays.length)}/${remoteTrackPlays.length} track plays`);
  }

  console.debug("Seeding track plays complete.");
};

try {
  await seedAlbums();
  await seedGenres();
  await seedArtists();
  await seedTracks();
  await seedTrackPlays();

  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await remotePrisma.$disconnect();
}