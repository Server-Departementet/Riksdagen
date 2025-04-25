"use server";

import type { TrackWithStats } from "../types";
import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import { InnerTrackElement } from "./inner-track-element";

// Color cache
const colorCachePath = "./cache/spotify-color-cache.json";
if (!fs.existsSync(colorCachePath)) fs.writeFileSync(colorCachePath, JSON.stringify({}), "utf-8");
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(colorCachePath, "utf-8"));
process.on("beforeExit", () => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"));
setInterval(() => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"), 5 * 60 * 1000);

const getImageColor = async (url: string) => {
  // Return cache
  if (colorCache[url]) return colorCache[url];
  // Get color
  const v = new Vibrant(url, { quality: 100, useWorker: true });
  const color = (await v.getPalette())?.LightVibrant?.hex;
  // Set cache
  if (color) colorCache[url] = color;
  return color;
}

export async function TrackElement({
  track,
  username,
  index,
  className = "",
  style = {},
}: {
  track: TrackWithStats,
  username: string,
  index: number,
  className?: string,
  style?: React.CSSProperties,
}) {
  "use cache";

  // Track duration
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Background color
  const bgColor = track.image ?
    await getImageColor(track.image) || "var(--color-zinc-100)"
    :
    "var(--color-zinc-100)";

  const prettyPlayCount = `${track.totalPlays} ${track.totalPlays > 1 ? "gånger" : "gång"}`;
  const prettyPlaytime = `${Math.floor(track.totalMS / 60000)} min`;

  return (
    <div
      id={`${track.id}-outer`}
      className={`flex flex-row items-center gap-x-0.5 rounded-[4px] min-h-[128px] bg-zinc-100 ${className}`}
      style={style}
    >
      <InnerTrackElement
        className="flex-1"
        bgColor={bgColor}
        track={track}
        minutes={minutes}
        seconds={seconds}
        prettyDuration={prettyDuration}
        prettyPlayCount={prettyPlayCount}
        prettyPlaytime={prettyPlaytime}
        username={username}
      />

      {/* Index number */}
      <span className="text-lg px-2 text-center">{index + 1}</span>
    </div>
  );
}