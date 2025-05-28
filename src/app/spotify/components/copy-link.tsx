"use client";
import { Button } from "@/components/ui/button";
import { LucideLink as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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