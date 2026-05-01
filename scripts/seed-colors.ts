import "dotenv/config";
import { env } from "node:process";
import { PrismaClient } from "@/lib/prisma/generated";
import { extractImageColor } from "../src/functions/extract-image-color";
import { makeMariaDBAdapter } from "../src/lib/prisma/mariadb-adapter";

const {
  DATABASE_URL,
} = env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");

seedColor()
  .then(() => {
    console.info("Finished seeding colors in database.");
    process.exitCode = 0;
  })
  .catch((err: unknown) => {
    console.error("Error seeding colors in database:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

async function seedColor() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");

  const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

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
