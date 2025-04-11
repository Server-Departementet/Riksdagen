// "use cache";

import type { Track } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import { Vibrant } from "node-vibrant/node";

export async function TrackPlay({ track, listeningTime, username }: { track: Track, listeningTime: number, username: string | null }) {

  // Track duration
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // const palette = track.image ? (await Vibrant.from(track.image).getPalette()) : null;

  // const colors = [
  //   palette?.DarkMuted?.hex,
  //   palette?.Vibrant?.hex,
  //   palette?.Muted?.hex,
  //   palette?.DarkVibrant?.hex,
  //   palette?.LightMuted?.hex,
  //   palette?.LightVibrant?.hex,
  // ];

  return (
    <div className="flex flex-row">
      {/* <div className="flex flex-row rounded-xl">
        {colors.map((color, i) => (
          <div key={i} className="size-5" style={{ backgroundColor: color }}></div>
        ))}
      </div> */}

      <Image width={128} height={128} className="rounded-[4px] h-full aspect-square" src={track.image ?? CrownSVG} alt="Låtbild" />

      <Link href={track.url} className="" target="_blank" rel="noopener noreferrer">
        <Button tabIndex={-1} className="m-2 px-2.5">
          <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
          Öppna i Spotify
        </Button>
      </Link>
    </div>
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