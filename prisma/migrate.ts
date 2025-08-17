import { PrismaClient, TrackPlay } from "../src/prisma/client";
// This json file is not provided. I made it with a little script that fetches the data from the database directly and serves as http bodies and a large json file
import trackPlays from "../../PostgresMigrate/trackPlays.json" with { type: "json" };

const prisma = new PrismaClient();

const port = 2500;
const host = "localhost";
const apiUrl = `http://${host}:${port}`;

const seedAlbums = async () => {
  console.debug("Seeding albums...");

  const remoteAlbums = await (await fetch(apiUrl + "/albums")).json();

  await prisma.album.createMany({
    data: remoteAlbums,
    skipDuplicates: true,
  });

  console.debug("Seeding albums complete.");
};

const seedArtists = async () => {
  console.debug("Seeding artists...");

  const remoteArtists = await (await fetch(apiUrl + "/artists")).json();


  for (const artist of remoteArtists) {
    const { genres, ...artistData } = artist;

    await prisma.artist.upsert({
      where: { id: artist.id },
      update: {
        ...artistData,
        genres: {
          connect: genres?.map((genre: { name: string }) => ({ name: genre.name })).filter(Boolean),
        },
      },
      create: {
        ...artistData,
        genres: {
          connect: genres?.map((genre: { name: string }) => ({ name: genre.name })).filter(Boolean),
        },
      },
    });
  }

  console.debug("Seeding artists complete.");
};

const seedGenres = async () => {
  console.debug("Seeding genres...");

  const remoteGenres = await (await fetch(apiUrl + "/genres")).json();

  await prisma.genre.createMany({
    data: remoteGenres,
    skipDuplicates: true,
  });

  console.debug("Seeding genres complete.");
};

const seedTracks = async () => {
  console.debug("Seeding tracks...");

  const remoteTracks = await (await fetch(apiUrl + "/tracks")).json();

  // Create each track with its artist relationships
  for (const track of remoteTracks) {
    const { artists, ...trackData } = track;

    await prisma.track.upsert({
      where: { id: track.id },
      update: {
        ...trackData,
        artists: {
          connect: artists?.map((artist: { id: string }) => ({ id: artist.id })).filter(Boolean),
        },
      },
      create: {
        ...trackData,
        artists: {
          connect: artists?.map((artist: { id: string }) => ({ id: artist.id })).filter(Boolean),
        },
      },
    });
  }

  console.debug("Seeding tracks complete.");
};

const seedTrackPlays = async () => {
  console.debug("Seeding track plays...");

  await prisma.trackPlay.createMany({
    data: trackPlays as TrackPlay[],
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
  });