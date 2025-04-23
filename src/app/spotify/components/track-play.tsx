"use server";

import type { TrackWithStats } from "../types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import { CopyLinkButton } from "./copy-link";

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

export async function TrackPlayElement({
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
      className={`flex flex-row items-center gap-x-0.5 rounded-[4px] bg-zinc-100 ${className}`}
      style={style}
    >
      <div
        className={`flex-1 grid grid-cols-[128px_1fr_max-content_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[128px] overflow-hidden gap-x-2 gap-y-1`}
        style={{ backgroundColor: bgColor }}
      >
        {/* ID to jump to. Offset to give more control */}
        <div id={track.id} className="col-start-1 row-start-1 relative -translate-y-32 h-0 -z-50"></div>

        {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
        <Image width={128} height={128} className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

        {/* Track info */}
        <h5 className="col-start-2 row-start-1 col-span-2 leading-5 py-1 overflow-x-auto whitespace-nowrap text-ellipsis overflow-y-hidden">{track.name}</h5>
        {/* Artists */}
        <p className="col-start-2 row-start-2 col-span-2 pb-1 font-semibold text-sm opacity-75 leading-4 whitespace-nowrap overflow-y-hidden overflow-x-auto">{track.artists.map(artist => artist.name).join(", ")}</p>

        {/* Stats */}
        <div className="row-span-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
          {/* Duration (long) */}
          <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
          {/* Listening time (long) */}
          <p className="hidden sm:block">{username} har lyssnat {prettyPlayCount} ({prettyPlaytime})</p>

          {/* Duration (short) */}
          <p className="block sm:hidden">Längd {prettyDuration}</p>
          {/* Listening time (short) */}
          <p className="block sm:hidden">{prettyPlayCount} ({prettyPlaytime})</p>
        </div>

        {/* Spotify Link */}
        <Link href={track.url} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end z-10" target="_blank" rel="noopener noreferrer">
          <Button tabIndex={-1} className="mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5">
            <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
            <span className="hidden sm:block">
              Öppna i Spotify
            </span>
          </Button>
        </Link>

        {/* Copy link button */}
        <CopyLinkButton className="mt-1.5 sm:mt-2 me-1.5 sm:me-2 col-start-4 row-start-1 row-span-2 justify-self-end self-start z-10" trackId={track.id} />
      </div>

      {/* Index number */}
      <span className="text-lg px-2 text-center">{index + 1}</span>
    </div>
  );
}