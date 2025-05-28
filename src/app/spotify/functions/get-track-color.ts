import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";

// Color cache
const colorCachePath = "./cache/spotify-color-cache.json";
if (!fs.existsSync(colorCachePath)) fs.writeFileSync(colorCachePath, JSON.stringify({}), "utf-8");
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(colorCachePath, "utf-8"));
process.on("beforeExit", () => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"));
setInterval(() => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"), 5 * 60 * 1000);

export const fallbackColor = "var(--color-zinc-100)";

/** 
 * Extracts prominent color from the image in the url and caches it to a file.
 */
export async function getTrackBGColor(url: string): Promise<string> {
  // Return cache
  if (colorCache[url]) return colorCache[url];

  // Calculate color
  const v = new Vibrant(url, { quality: 100, useWorker: true });
  const color = (await v.getPalette())?.LightVibrant?.hex;

  // If no color found, return default
  if (!color) return fallbackColor;

  // Set cache
  if (color) colorCache[url] = color;
  return color;
}