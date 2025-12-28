// @ts-check

import "dotenv/config";
import { PrismaClient } from "../prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import path from "node:path";

const envDatabaseUrl = process.env.DATABASE_URL;
if (!envDatabaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}
const dbURL = new URL(envDatabaseUrl);
const adapter = new PrismaMariaDb({
  host: dbURL.hostname,
  port: Number(dbURL.port),
  user: dbURL.username,
  password: dbURL.password,
  database: dbURL.pathname.slice(1),
});

const prisma = new PrismaClient({ adapter });

const imageURLs = [...new Set((await prisma.track.findMany({ select: { image: true } }))
  .map(t => t.image))]
  .filter(t => typeof t === "string")
  .filter(u => { try { new URL(u); return true; } catch { return false; } });

console.info(`Found ${imageURLs.length} unique image URLs to process.`);

const cachePath = fs.existsSync(path.join("../", ".next", "standalone", "cache", "spotify-color-cache.json"))
  ? path.join("../", ".next", "standalone", "cache", "spotify-color-cache.json")
  : path.join("./cache", "spotify-color-cache.json");

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({}), { encoding: "utf-8" });
}
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(cachePath, "utf-8"));

const processImage = async (url: string) => {
  if (colorCache[url]) return colorCache[url];
  const v = new Vibrant(url, { quality: 100, useWorker: true });
  const color = (await v.getPalette())?.LightVibrant?.hex;
  if (color) colorCache[url] = color;
  return color;
};

async function main() {
  const maxStreams = 10;
  let streamCount = 0;

  const processed = new Array(imageURLs.length).fill(false);

  const logInterval = setInterval(() => {
    const processedCount = processed.filter(Boolean).length;
    const totalCount = imageURLs.length;
    console.info(`Processed ${processedCount} of ${totalCount} (${Math.round((processedCount / totalCount) * 100)}%)`);

    if (processedCount >= totalCount) {
      clearInterval(logInterval);
      console.info("All images processed");
    }
  }, 500);

  await Promise.all(
    imageURLs.map(async (url, i) => {
      while (streamCount >= maxStreams) {
        // Wait for a stream to finish
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      streamCount++;
      processImage(url)
        .then(_ => {
          processed[i] = true;
        })
        .catch(err => {
          console.error(`Error processing ${url}:`, err);
        })
        .finally(() => {
          streamCount--;
        });
    }),
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  while (streamCount > 0) {
    // Wait for all streams to finish
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}


main()
  .then(() => {
    fs.writeFileSync(cachePath, JSON.stringify(colorCache), { encoding: "utf-8" });
    console.info(`Color cache saved with ${Object.keys(colorCache).length} entries to ${cachePath}`);
    process.exitCode = 0;
  })
  .catch(err => {
    console.error("Error in processing:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });