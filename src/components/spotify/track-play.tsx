"use cache";

import type { Track } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import { Vibrant } from "node-vibrant/node";

const getPalette = async (url: string | null, quality: number) => {
  const v = url ? new Vibrant(url, { quality: quality, useWorker: true }) : null
  return await v?.getPalette();
}

export async function TrackPlay({ track, listeningTime, username }: { track: Track, listeningTime: number, username: string | null }) {
  "use cache";

  // Track duration
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const palette = await getPalette(track.image || null, 100);
  const bgColor = palette?.LightVibrant?.hex || "var(--color-zinc-100)"; // Contrasty against black text

  return (
    <div className="grid grid-cols-[128px_1fr_max-content] grid-rows-[max-content_max-content_1fr_max-content] rounded-[4px] h-[128px] gap-x-2" style={{ backgroundColor: bgColor }}>

      {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
      <Image width={128} height={128} className="row-span-4 rounded-[4px] size-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

      {/* Track info */}
      <h5 className="col-start-2 col-span-2">{track.name}</h5>
      {/* Artists */}
      <p className="col-start-2 col-span-2 font-semibold text-sm opacity-75 -mt-1">{track.artists.map(artist => artist.name).join(", ")}</p>

      {/* Stats */}
      <div className="row-span-2 text-sm flex-1">
        {/* Duration */}
        <p>Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Listening time */}
        <p>{username ?? "Personer"} har lyssnat totalt {Math.round(listeningTime / 60000)} min</p>
        {/* Count */}
        <p>Det motsvara {Math.round(listeningTime / track.duration)} av låten</p>
      </div>

      {/* Spotify Link */}
      <Link href={track.url} className="col-start-3 row-start-4 justify-self-end self-end" target="_blank" rel="noopener noreferrer">
        <Button tabIndex={-1} className="m-2 px-2.5">
          <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
          Öppna i Spotify
        </Button>
      </Link>
    </div >
  );
}

// {/* Image */}
// {track.image ?
//   // 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design
//   <Image width={128} height={128} className="rounded-[4px] h-full aspect-square" src={track.image} alt="Låtbild" />
//   :
//   // 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design
//   <Image width={128} height={128} className="rounded-[4px] h-full translate-y-2 p-1" src={CrownSVG} alt="Låtbild" />
// }

// Track info
// <div className="w-full">
// {/* Title */}
// <h5 className="">{track.name}</h5>
// {/* Artists */}
// <p className="font-semibold text-sm opacity-70 -mt-1">{track.artists.map(artist => artist.name).join(", ")}</p>
// </div>


// Stats
// <div className="text-sm flex-1">
//   {/* Duration */}
//   <p>Längd {minutes} min {seconds} sek ({prettyDuration})</p>
//   {/* Listening time */}
//   <p>{username ?? "Personen"} har lyssnat totalt {Math.floor(listeningTime / 60000)} min</p>
// </div>


// Spotify link
// <Link href={track.url} className="" target="_blank" rel="noopener noreferrer">
//   <Button className="m-2 px-2.5">
//     <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
//     Öppna i Spotify
//   </Button>
// </Link>