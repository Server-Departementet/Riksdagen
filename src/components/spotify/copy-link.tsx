"use client";
import { Button } from "@/components/ui/button";
import { LucideLink as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ trackId, className = "" }: { trackId: string, className?: string }) {
  const copyLink = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `#${trackId}`;
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

export function JumpToHashHighlighter() {
  const isClient = typeof window !== "undefined";

  // This has the pulse to make tailwind load it
  const DOM = <div id="jump-to-hash" className="animate-pulse"></div>;

  if (isClient) {
    const trackId = new URL(window.location.href).hash.replace("#", "");
    if (!trackId) return DOM;
    const jumpElement = document.getElementById(trackId);
    if (!jumpElement) return DOM;
    const trackElement = jumpElement.parentElement;
    if (!trackElement) return DOM;

    trackElement.classList.add("animate-pulse");
    setTimeout(() => {
      trackElement.classList.remove("animate-pulse");
    }, 4500);
  }

  return DOM;
}