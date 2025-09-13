"use client";
import { Button } from "@/components/ui/button";
import { useSpotifyContext } from "../context/spotify-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LinkIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { defaultFilter, SortingMethodNames } from "../types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function FilterPanel() {
  const { spotifyContext: { filter }, setSpotifyContext } = useSpotifyContext();
  const { reverse } = filter;
  return (
    <aside className={`flex flex-col py-4`}>
      {/* Share link (save filters in params) */}
      <div className="mb-4 flex flex-row items-center justify-start">
        <Button
          className="w-full"
          variant={"outline"}
          onClick={() => {
            const params = new URLSearchParams();
            if (filter.search.length) params.set("q", filter.search);
            if (filter.reverse !== defaultFilter.reverse) params.set("reverse", String(filter.reverse));
            if (filter.sort !== defaultFilter.sort) params.set("sort", filter.sort);
            if (filter.selectedUsers.length && filter.selectedUsers.length !== Object.keys(filter.selectedUsers).length) {
              params.set("users", filter.selectedUsers.map(u => u.id).join(","));
            }
            const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

            toast.success("Filterlänk kopierad till urklipp", { duration: 3000 });
            navigator.clipboard.writeText(shareUrl);
          }}
        >
          Dela filter
          <LinkIcon />
        </Button>
      </div>

      {/* Sorting */}
      <div className="w-full flex flex-row items-center justify-center gap-x-1">
        <Select
          value={filter.sort}
          onValueChange={(value) => setSpotifyContext(prev => ({
            ...prev, filter:
            {
              ...prev.filter,
              sort: Object.keys(SortingMethodNames).includes(value) ? value as keyof typeof SortingMethodNames : prev.filter.sort,
            }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sortera..." />
          </SelectTrigger>

          <SelectContent>
            {Object.entries(SortingMethodNames).map(([id, label]) => (
              <SelectItem key={`sorting-${id}`} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reverse order */}
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => setSpotifyContext(prev => ({ ...prev, filter: { ...prev.filter, reverse: !filter.reverse } }))}
          className={`${reverse ? "bg-gray-600 text-white" : ""}`}
          aria-label={reverse ? "Sortera stigande" : "Sortera fallande"}
        >
          {reverse
            ? <SortAscIcon />
            : <SortDescIcon />
          }
        </Button>
      </div>

      {/* Search */}
      <div className="w-full flex flex-row items-center justify-center">
        <Input
          type="text"
          placeholder="Sök låt, artist eller album..."
          value={filter.search}
          onChange={(e) => setSpotifyContext(prev => ({ ...prev, filter: { ...prev.filter, search: e.target.value } }))}
          className="mt-4 w-full"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </div>

      

      <pre className="h-0">{JSON.stringify(filter, null, 2)}</pre>
    </aside>
  );
}