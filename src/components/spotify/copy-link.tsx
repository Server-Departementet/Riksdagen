"use client";
import { Button } from "@/components/ui/button";
import { LucideLink as LinkIcon } from "lucide-react";
import { toast } from "sonner";

/** Copies the link to a unique track */
export function CopyLinkButton({ trackId, className = "" }: { trackId: string, className?: string }) {
  const copyLink = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("track", trackId);
    navigator.clipboard.writeText(currentUrl.href).then(() => {
      toast.success("Länk kopierad!", {
        description: "Länken har kopierats till dina urklipp!",
        duration: 5000,
      });
    });
  };

  return (
    <Button onClick={copyLink} variant={"ghost"} className={className}>
      <LinkIcon strokeWidth={2.5} size={44} className="size-full" />
    </Button>
  );
}

/** When jumping to a track via its link, this client side element handles the reinforcing highlight of that track */
export function JumpToTrackHighlightHandler() {
  if (typeof window === "undefined") return <></>

  const trackId = new URL(window.location.href).searchParams.get("track");
  if (!trackId) return <></>;

  const jumpElement = document.getElementById(trackId);
  if (!jumpElement) return <></>;

  const trackElement = jumpElement.parentElement;
  if (!trackElement) return <></>;

  jumpElement.scrollIntoView({ behavior: "smooth", block: "start" });

  trackElement.classList.add("pulse-animation");
  setTimeout(() => {
    trackElement.classList.remove("pulse-animation");
  }, 4500);

  return <></>;
}