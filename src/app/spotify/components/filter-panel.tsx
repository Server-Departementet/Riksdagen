"use client";
import { Button } from "@/components/ui/button";
import { useSpotifyContext } from "../context/spotify-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LinkIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { defaultFilter, SortingMethodNames } from "../types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";

export default function FilterPanel() {
  const { spotifyContext, spotifyContext: { filter, users }, setSpotifyContext } = useSpotifyContext();
  return (
    <aside className={`flex flex-col py-4 gap-y-2`}>
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
            if (filter.selectedUsers.length && filter.selectedUsers.length !== users.length) {
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

      {/* Users */}
      <div className="w-full flex flex-row items-center justify-center gap-x-1">
        <ToggleGroup
          type="multiple"
          value={
            // If no users are selected, select all
            filter.selectedUsers.length === 0
              ? users.map(u => u.id)
              : filter.selectedUsers.map(u => u.id)
          }
          onValueChange={(value) => {
            setSpotifyContext(prev => ({
              ...prev,
              filter: {
                ...prev.filter,
                selectedUsers: users.filter(u => value.includes(u.id)),
              }
            }));
          }}
          className="w-fit flex-col *:w-full"
        >
          {users.map(user => (
            <ToggleGroupItem
              key={`filter-user-${user.id}`}
              value={user.id}
              className={`
                bg-zinc-100 text-zinc-500 
                aria-pressed:!bg-gray-600 aria-pressed:!text-white
                first:rounded-none first:rounded-tl-lg first:rounded-tr-lg 
                last:rounded-none last:rounded-bl-lg last:rounded-br-lg
                first:pt-0.5 last:pb-0.5
                px-1.5 py-0.5
              `}
            >
              {user.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
          className={`${filter.reverse ? "bg-gray-600 text-white" : ""}`}
          aria-label={filter.reverse ? "Sortera stigande" : "Sortera fallande"}
        >
          {filter.reverse
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
          className="w-full"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </div>

      <pre className="h-0 mt-10 w-40 max-w-40">
        {JSON.stringify(spotifyContext.resultingTrackIds.length)}
        <br />
        {JSON.stringify(filter, null, 2)}
      </pre>
    </aside>
  );
}