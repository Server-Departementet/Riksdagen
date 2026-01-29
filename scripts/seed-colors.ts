import "dotenv/config";
import { env } from "node:process";
import { PrismaClient } from "../src/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { extractImageColor } from "../src/functions/extract-image-color.ts";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

seedColor()
  .then(() => {
    console.info("Finished seeding colors in database.");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Error seeding colors in database:", error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

async function seedColor() {
  const dbURL = new URL(env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: decodeURI(dbURL.hostname),
    port: Number(decodeURI(dbURL.port)),
    user: decodeURI(dbURL.username),
    password: decodeURI(dbURL.password),
    database: decodeURI(dbURL.pathname.slice(1)),
    connectionLimit: 5,
  });
  const prisma = new PrismaClient({ adapter });

  const [
    albums,
    artists,
  ] = await Promise.all([
    prisma.album.findMany(),
    prisma.artist.findMany(),
  ]);

  console.info(`Seeding colors for ${albums.length} albums and ${artists.length} artists...`);

  let count = 0;

  // Set colors in parallell
  await Promise.all([
    ...albums.map(async (album) => {
      if (!album.image) return;
      const color = await extractImageColor(album.image);
      if (color) album.color = color;

      count += 1;
      console.info(`${count}/${albums.length + artists.length} - Processed album: ${album.name}`);
    }),
    ...artists.map(async (artist) => {
      if (!artist.image) return;
      const color = await extractImageColor(artist.image);
      if (color) artist.color = color;

      count += 1;
      console.info(`${count}/${albums.length + artists.length} - Processed artist: ${artist.name}`);
    }),
  ]);

  console.info("Saving colors to database...");

  // Save all updated albums and artists
  for (const album of albums) {
    if (album.color) {
      await prisma.album.update({
        where: { id: album.id },
        data: { color: album.color },
      });
    }
  }
  for (const artist of artists) {
    if (artist.color) {
      await prisma.artist.update({
        where: { id: artist.id },
        data: { color: artist.color },
      });
    }
  }

  console.info("Saved colors to database.");

  console.info(`Seeded colors for ${albums.length} albums and ${artists.length} artists.`);
}
