import "dotenv/config";
import { env } from "node:process";
import { PrismaClient, TrackPlay } from "../src/prisma/generated/client.js";
import { createMariaDbAdapter } from "../src/lib/mariadb-url.ts";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
if (!env.MERGE_DB_A) {
  throw new Error("MERGE_DB_A is not set in environment variables");
}
if (!env.MERGE_DB_B) {
  throw new Error("MERGE_DB_B is not set in environment variables");
}

merge()
  .then(() => {
    console.info("Finished merging databases.");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Error merging databases:", error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

async function merge() {
  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(env.DATABASE_URL!) });

  const prismaA = new PrismaClient({ adapter: createMariaDbAdapter(env.MERGE_DB_A!) });

  const prismaB = new PrismaClient({ adapter: createMariaDbAdapter(env.MERGE_DB_B!) });

  /* 
   * Genres
   */
  const genresA = await prismaA.genre.findMany();
  const genresB = await prismaB.genre.findMany();
  const allGenres = [...genresA, ...genresB];
  console.info("Total genres to merge:", allGenres.length, "Sample:", allGenres.slice(0, 3));
  await prisma.genre.createMany({
    data: allGenres,
    skipDuplicates: true,
  });
  console.info("Finished writing merged genres");

  /* 
   * Albums
   */
  const albumsA = await prismaA.album.findMany();
  const albumsB = await prismaB.album.findMany();
  const allAlbums = [...albumsA, ...albumsB];
  console.info("Total albums to merge:", allAlbums.length, "Sample:", allAlbums.slice(0, 3));
  await prisma.album.createMany({
    data: allAlbums,
    skipDuplicates: true,
  });
  console.info("Finished writing merged albums");

  /* 
   * Tracks
   */
  const tracksA = await prismaA.track.findMany();
  const tracksB = await prismaB.track.findMany();
  const allTracks = [...tracksA, ...tracksB];
  console.info("Total tracks to merge:", allTracks.length, "Sample:", allTracks.slice(0, 3));
  await prisma.track.createMany({
    data: allTracks,
    skipDuplicates: true,
  });
  console.info("Finished writing merged tracks");

  /* 
   * Artists
   */
  const artistsA = await prismaA.artist.findMany();
  const artistsB = await prismaB.artist.findMany();
  const allArtists = [...artistsA, ...artistsB];
  console.info("Total artists to merge:", allArtists.length, "Sample:", allArtists.slice(0, 3));
  await prisma.artist.createMany({
    data: allArtists,
    skipDuplicates: true,
  });
  console.info("Finished writing merged artists");

  /* 
   * Track Plays
   */
  const trackPlaysA = await prismaA.trackPlay.findMany();
  const trackPlaysB = await prismaB.trackPlay.findMany();
  console.info("Track plays in A:", trackPlaysA.length, "Sample:", trackPlaysA.slice(0, 3));
  console.info("Track plays in B:", trackPlaysB.length, "Sample:", trackPlaysB.slice(0, 3));

  const allTrackPlays = [...trackPlaysA, ...trackPlaysB];
  console.info("Total track plays to merge:", allTrackPlays.length, "Sample:", allTrackPlays.slice(0, 3));

  const users = await prisma.user.findMany();
  const remappedTrackPlays = allTrackPlays.map(tp => {
    const user = users.find(u => tp.userId === u.clerkDevId || tp.userId === u.clerkProdId || tp.userId === u.id);
    if (!user) throw new Error(`No user found for track play with userId ${tp.userId}`);
    return {
      ...tp,
      userId: user.id, // Convert to proper id
    };
  });

  // Remove dupes now that userIds are normalized
  const uniqueTrackPlaysMap: Record<string, TrackPlay> = {};
  for (const tp of remappedTrackPlays) {
    const key = `${tp.userId}-${tp.trackId}-${tp.playedAt.toISOString()}`;
    if (!uniqueTrackPlaysMap[key]) {
      uniqueTrackPlaysMap[key] = tp;
    }
  }

  const uniqueTrackPlays = Object.values(uniqueTrackPlaysMap);
  console.info("Unique track plays after deduplication. Sample:", uniqueTrackPlays.length, uniqueTrackPlays.slice(0, 3));

  console.info("Writing merged track plays to local database");
  await prisma.trackPlay.createMany({
    data: uniqueTrackPlays,
    skipDuplicates: true,
  });
  console.info("Finished writing merged track plays");
}
