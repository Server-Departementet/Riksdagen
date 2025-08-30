import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import path from "node:path";

// Try reading cache file
const colorCachePath = path.join("./", "cache", "spotify-color-cache.json");
const colorCache: Record<string, string> = {};
if (fs.existsSync(colorCachePath)) {
  try {
    const data = fs.readFileSync(colorCachePath, "utf-8");
    const parsed = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null) {
      Object.assign(colorCache, parsed);
    }
  } catch (error) {
    console.error("Error reading color cache:", error);
  }
}
// Write cache file on exit
process.on("beforeExit", () => {
  try {
    // Ensure cache directory exists
    const dir = path.dirname(colorCachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8");
  }
  catch (error) {
    console.error("Error writing color cache:", error);
  }
});

/** 
 * Extracts prominent color from the image in the url and caches it to a file.
 */
export async function getTrackBGColor(url: string | null): Promise<string | null> {
  "use cache";
  // This use cache might be excessive

  if (!url) return null;

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error("Invalid URL provided:", url, error);
    return null;
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
    return null;
  }

  // If no color found
  if (!color) return null;

  // Set cache
  if (color) colorCache[url] = color;
  return color;
}