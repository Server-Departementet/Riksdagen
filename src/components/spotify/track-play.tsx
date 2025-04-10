import type { Track } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };

export function TrackPlay({ user, track }: { user: object, track: Track }) {

  // Track duration
  const minutes = Math.floor(track.duration / 60000);
  const seconds = Math.floor((track.duration % 60000) / 1000);
  const prettyDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Link href={track.url} className="flex flex-row gap-x-3 bg-zinc-100 rounded-xl no-global hover:text-blue-800" target="_blank" rel="noopener noreferrer">
      {/* Image */}
      {track.image ?
        <Image width={96} height={96} src={track.image} alt="Låtbild" className="rounded-xl" />
        :
        <Image width={96} height={96} src={CrownSVG} alt="Låtbild" />
      }

      <div className="flex flex-col py-1">
        {/* Title */}
        <h4>{track.name}</h4>
        {/* <p>{track.artists.join(", ")}</p> */}
        {/* Duration */}
        <p className="pl-1">Längd {minutes} min {seconds} sek ({prettyDuration})</p>
        {/* Artist */}
      </div>
    </Link>
  );
}