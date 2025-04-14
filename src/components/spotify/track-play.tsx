import type { Track } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import { Vibrant } from "node-vibrant/node";
import fs from "node:fs";
import { CopyLinkButton } from "./copy-link";

// Color cache
const colorCachePath = "./src/components/spotify/color-cache.json";
if (!fs.existsSync(colorCachePath)) fs.writeFileSync(colorCachePath, JSON.stringify({}), "utf-8");
const colorCache: Record<string, string> = JSON.parse(fs.readFileSync(colorCachePath, "utf-8"));
process.on("beforeExit", () => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"));
setInterval(() => fs.writeFileSync(colorCachePath, JSON.stringify(colorCache), "utf-8"), 5 * 60 * 1000);

const getImageColor = async (url: string, quality: number = 100) => {
  // Return cache
  if (colorCache[url]) return colorCache[url];
  // Get color
  const v = new Vibrant(url, { quality, useWorker: true });
  const color = (await v.getPalette())?.LightVibrant?.hex;
  // Set cache
  if (color) colorCache[url] = color;
  return color;
}

export async function TrackPlayElement({ track, trackPlayCount, listeningTime, username }: { track: Track, trackPlayCount: number, listeningTime: number, username: string | null }) {

  // Track duration
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Background color
  const bgColor = track.image ?
    await getImageColor(track.image, 100) || "var(--color-zinc-100)"
    :
    "var(--color-zinc-100)";

  const listenedCountText = trackPlayCount > 1 ? "gånger" : "gång";
  const listenedMin = Math.round(listeningTime / 60000);

  return (
    <div className="grid grid-cols-[128px_1fr_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[128px] overflow-y-auto gap-x-2" style={{ backgroundColor: bgColor }}>
      {/* ID to jump to. Offset to align better with */}
      <div id={track.id} className="col-start-1 row-start-1 relative -translate-y-32 h-0 -z-50"></div>

      {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
      <Image width={128} height={128} className="col-start-1 row-start-1 row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

      {/* Track info */}
      <h5 className="row-start-1 col-start-2 col-span-2">{track.name}</h5>
      {/* Artists */}
      <p className="row-start-2 col-start-2 col-span-3 font-semibold text-sm opacity-75 -mt-1">{track.artists.map(artist => artist.name).join(", ")}</p>

      {/* Stats */}
      <div className="row-span-2 text-sm flex-1">
        {/* Duration (long) */}
        <p className="hidden sm:block">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time (long) */}
        <p className="hidden sm:block">{username ?? "Alla"} har lyssnat totalt {trackPlayCount} {listenedCountText} ({listenedMin} min)</p>

        {/* Duration (short) */}
        <p className="block sm:hidden">Längd {prettyDuration}</p>
        {/* Listening time (short) */}
        <p className="block sm:hidden">Lyssnat {trackPlayCount} {listenedCountText}<br />({listenedMin} min)</p>
      </div>

      {/* Spotify Link */}
      <Link href={track.url} className="col-start-3 row-start-4 justify-self-end self-end z-10" target="_blank" rel="noopener noreferrer">
        <Button tabIndex={-1} className="mb-2 px-2.5">
          <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
          <span className="hidden sm:block">
            Öppna i Spotify
          </span>
        </Button>
      </Link>

      {/* Copy link button */}
      <CopyLinkButton trackId={track.id} />
    </div >
  );
}