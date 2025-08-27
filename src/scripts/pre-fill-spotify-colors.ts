import { PrismaClient } from "../prisma/client";
import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const images = (await prisma.track.findMany())
  .map(track => track.image)
  .filter(Boolean) as string[];

const preferredCachePath = path.join("../", ".next", "standalone", "cache", "spotify-color-cache.json");
const colorCachePath = path.join("./cache", "spotify-color-cache.json");

let cachePath = preferredCachePath;

if (fs.existsSync(preferredCachePath)) {
  cachePath = preferredCachePath;
} 
else {
  cachePath = colorCachePath;
}

if (!fs.existsSync(cachePath)) {
  if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  // Create empty cache file
  fs.writeFileSync(cachePath, JSON.stringify({}), { encoding: "utf-8" });
}
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
process.on("beforeExit", () => fs.writeFileSync(cachePath, JSON.stringify(colorCache), "utf-8"));

const processImage = async (url: string) => {
  if (colorCache[url]) return colorCache[url];
  const v = new Vibrant(url, { quality: 100, useWorker: true });
  const color = (await v.getPalette())?.LightVibrant?.hex;
  if (color) colorCache[url] = color;
  return color;
}

const maxStreams = 5;
let streamCount = 0;

const processed = new Array(images.length).fill(false);

const logInterval = setInterval(() => {
  const processedCount = processed.filter(Boolean).length;
  const totalCount = images.length;
  console.info(`Processed ${processedCount} of ${totalCount} (${Math.round((processedCount / totalCount) * 100)}%)`);

  if (processedCount >= totalCount) {
    clearInterval(logInterval);
    console.info("All images processed");
  }
}, 500);

images.forEach(async (url, i) => {
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
});