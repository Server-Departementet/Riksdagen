"use client";
import { Button } from "@/components/ui/button";
import { LucideLink as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Link from "next/link";
import Image from "next/image";

/** Copies the link to a unique track */
export function CopyLinkButton({ trackId, className = "" }: { trackId: string, className?: string }) {
  const [url, setURL] = useState<string>("");

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("track", trackId);
    setURL(currentUrl.href);
  }, [trackId]);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Länk kopierad!", {
        description: "Länken har kopierats till dina urklipp!",
        duration: 5000,
      });
    });
  };

  return (
    <Button
      title={url || "Kopiera länk"}
      onClick={copyLink}
      variant={"ghost"}
      className={className}
    >
      <LinkIcon strokeWidth={2.5} size={44} className="size-full" />
    </Button>
  );
}

export function OpenInSpotifyButton({ trackURL }: { trackURL: string }) {
  return (
    <Link href={trackURL} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end z-10" target="_blank" rel="noopener noreferrer">
      <Button tabIndex={-1} className="mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5">
        <Image width={21} height={21} src={SpotifyIconSVG} alt="Spotify" />
        <span className="hidden sm:block">
          Öppna i Spotify
        </span>
      </Button>
    </Link>
  );
}