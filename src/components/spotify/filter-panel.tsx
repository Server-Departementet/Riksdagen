"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import {
  DEFAULT_SPOTIFY_SORT_DIRECTION,
  DEFAULT_SPOTIFY_SORT_VALUE,
  SPOTIFY_SORT_OPTIONS,
  SpotifySortDirection,
  SpotifySortValue,
} from "@/lib/spotify-sort";

export function FilterPanel({
  users,
  selectedUsers: initialSelectedUsers,
  query: initialQuery,
  sortValue: initialSortValue,
  sortDirection: initialSortDirection,
}: {
  users: { id: string; name: string | null; }[];
  selectedUsers: { id: string; name: string | null; }[];
  query?: string;
  sortValue: SpotifySortValue;
  sortDirection: SpotifySortDirection;
}) {
  for (const user of users) {
    if (user.name === null) {
      console.warn("User with null name detected:", user);
    }
  }

  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [sortOption, setSortOption] = useState<SpotifySortValue>(initialSortValue);
  const [sortDirection, setSortDirection] = useState<SpotifySortDirection>(initialSortDirection);

  return (
    <form
      className={`
        flex flex-col justify-center
        gap-y-4
      `}
      action={() => {
        // Reload with selected users as query params
        const params = new URLSearchParams();
        if (selectedUsers.length > 0) {
          params.append(
            "users",
            selectedUsers.map(u => u.id).join(","),
          );
        }

        if (searchQuery.trim() !== "") {
          params.append(
            "q",
            searchQuery.trim(),
          );
        }

        if (sortOption !== DEFAULT_SPOTIFY_SORT_VALUE) {
          params.append("sort", sortOption);
        }

        if (sortDirection !== DEFAULT_SPOTIFY_SORT_DIRECTION) {
          params.append("dir", sortDirection);
        }

        window.location.search = params.toString();
      }}
    >
      {/* User filter */}
      <div className="w-fit">
        <h4>Ministrar</h4>

        <div className="flex flex-col">
          {users.map(user =>
            <label
              key={"filter-" + user.id}
              className="flex justify-between items-center gap-x-2 w-full"
            >
              {user.name?.replace(/\s/g, "\u00a0") ?? "!!FEL!!"}

              <Checkbox
                defaultChecked={selectedUsers.some(u => u.id === user.id)}
                onClick={(e) => {
                  if (!(e.target instanceof HTMLButtonElement)) return;

                  if (e.target.dataset.state === "unchecked") {
                    setSelectedUsers(prev => [
                      ...prev,
                      user,
                    ]);
                  }
                  else {
                    setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label>
          <h4>Sök</h4>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Sök låt, album eller artist"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Sortering</h4>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={value => setSortOption(value as SpotifySortValue)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              {SPOTIFY_SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            aria-label={sortDirection === "desc" ? "Fallande ordning" : "Stigande ordning"}
            aria-pressed={sortDirection === "asc"}
            onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
            className="h-10 w-10 p-0"
          >
            {sortDirection === "asc"
              ? <ArrowDownNarrowWide className="size-5" />
              : <ArrowDownWideNarrow className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Refresh button */}
      <Button
        type="submit"
        variant={"outline"}
        className="hover:bg-gray-800 hover:text-white"
      >
        Uppdatera
      </Button>
    </form>
  );
}