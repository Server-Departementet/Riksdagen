"use client";
import { Button } from "@/components/ui/button";
import { LucideLink as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ trackId }: { trackId: string }) {

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
    <Button onClick={copyLink} variant={"ghost"} className="mt-2 col-start-3 row-start-1 row-span-2 justify-self-end self-start z-10">
      <LinkIcon strokeWidth={2.5} size={44} className="size-full" />
    </Button>
  );
}