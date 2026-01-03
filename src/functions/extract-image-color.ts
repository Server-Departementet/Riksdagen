import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";

// Color cache
const colorCachePath = "./cache/spotify-color-cache.json";
if (!fs.existsSync(colorCachePath)) {
  fs.mkdirSync("./cache", { recursive: true });
  fs.writeFileSync(colorCachePath, JSON.stringify({}), "utf-8");
}
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(colorCachePath, "utf-8"));
process.on("beforeExit", () => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"));
setInterval(() => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"), 5 * 60 * 1000);

/** 
 * Extracts prominent color from the image in the url and caches it to a file.
 */
export async function extractImageColor(url: string): Promise<string | undefined> {
  if (!url) return undefined;

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error("Invalid URL provided:", url, error);
    return undefined;
  }

  // Return cache
  if (colorCache[url]) return colorCache[url];

  // Calculate color
  let color: string | undefined = undefined;
  try {
    const v = new Vibrant(url, { quality: 100, useWorker: true });
    color = (await v.getPalette())?.LightVibrant?.hex;
  }
  catch (error) {
    console.error("Error fetching color from URL:", url, error);
    return undefined;
  }

  // If no color found, return default
  if (!color) return undefined;

  // Set cache
  if (color) colorCache[url] = color;
  return color;
}