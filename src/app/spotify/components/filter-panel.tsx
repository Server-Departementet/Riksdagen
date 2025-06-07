"use client";

import type { User } from "@/app/spotify/types";
import { useFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { useLocalFilterContext } from "@/app/spotify/context/local-filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCallback } from "react";
import { sortingFunctions } from "../functions/track-sorting";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortAscIcon, SortDescIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FilterPanel({ userMap, className = "" }: { userMap: Record<string, User>, className?: string }) {
  const { fetchFilter, setFetchFilter } = useFetchFilterContext();
  const { localFilter, setLocalFilter } = useLocalFilterContext();

  let userToggleDebounceTimeout: NodeJS.Timeout | null = null;
  const handleUserToggle = useCallback((value: string[]) => {
    // Clear previous timeout if it exists
    if (userToggleDebounceTimeout) clearTimeout(userToggleDebounceTimeout);

    const userIds = value;
    const users = userIds.map(id => userMap[id]).filter(Boolean) as User[];

    // Set a new timeout to debounce the user toggle action
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userToggleDebounceTimeout = setTimeout(() => {
      setFetchFilter(prev => ({
        ...prev,
        users,
      }));
    }, 750);
  }, [userToggleDebounceTimeout, setFetchFilter, userMap]);

  let searchChangeDebounceTimeout: NodeJS.Timeout | null = null;
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous timeout if it exists
    if (searchChangeDebounceTimeout) clearTimeout(searchChangeDebounceTimeout);

    const searchValue = e.target.value;

    // Set a new timeout to debounce the search change action
    // eslint-disable-next-line react-hooks/exhaustive-deps
    searchChangeDebounceTimeout = setTimeout(() => {
      setLocalFilter(prev => ({
        ...prev,
        search: searchValue,
      }));
    }, 750);
  }, [searchChangeDebounceTimeout, setLocalFilter]);

  let sortChangeDebounceTimeout: NodeJS.Timeout | null = null;
  const handleSortChange = useCallback((value: string) => {
    // Clear previous timeout if it exists
    if (sortChangeDebounceTimeout) clearTimeout(sortChangeDebounceTimeout);

    // Set a new timeout to debounce the sort change action
    // eslint-disable-next-line react-hooks/exhaustive-deps
    sortChangeDebounceTimeout = setTimeout(() => {
      setLocalFilter(prev => ({
        ...prev,
        sort: value as typeof prev.sort,
      }));
    }, 750);
  }, [setLocalFilter]);

  return (
    <div className={`
      flex flex-row justify-center sm:justify-end
      pt-5 px-6
      overflow-y-auto
      bg-white
        z-20
      ${className}
    `}>
      {/* Nested divs in order to easily align everything toward the end of the container */}
      <div className="flex flex-col gap-y-2 overflow-x-hidden">
        <h1 className="text-3xl">Spotify-statistik</h1>

        {/* User filter */}
        <div className="w-full flex flex-col items-center">
          <ToggleGroup
            variant="outline"
            type="multiple"
            defaultValue={fetchFilter.users.map(u => u.id)}
            onValueChange={handleUserToggle}
            className="w-fit flex-col *:w-full"
          >
            {Object.values(userMap).map(u => (
              <ToggleGroupItem
                value={u.id}
                key={`user-${u.id}`}
                className={`
                    bg-zinc-100 text-zinc-500 
                    aria-pressed:!bg-gray-600 aria-pressed:!text-white
                    first:rounded-none first:rounded-tl-lg first:rounded-tr-lg 
                    last:rounded-none last:rounded-bl-lg last:rounded-br-lg
                    first:pt-0.5 last:pb-0.5
                    px-1.5 py-0.5
                  `}
              >
                {u.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Sort */}
        <div className="full flex flex-row items-center justify-center gap-x-1">
          <Select defaultValue={localFilter.sort || fetchFilter.sort} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sortera..." />
            </SelectTrigger>

            <SelectContent>
              {Object.values(sortingFunctions).map((sortingFunc, i) => (
                <SelectItem
                  key={`sorting-${i}-${sortingFunc.id}`}
                  value={sortingFunc.id}
                >
                  {sortingFunc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reverse order */}
          <Button variant={"ghost"} size={"icon"} onClick={() => setLocalFilter(prev => ({
            ...prev,
            reverseOrder: !prev.reverseOrder,
          }))}>
            {localFilter.reverseOrder
              ? <SortAscIcon />
              : <SortDescIcon />
            }
          </Button>
        </div>

        {/* Search filter */}
        <div className="w-full flex flex-col items-center px-3">
          <Input
            type="text"
            placeholder="Sök låt, artist, album..."
            defaultValue={localFilter.search}
            onChange={handleSearchChange}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <pre>
          Local =&nbsp;
          {JSON.stringify(localFilter, null, 2)}
          <br />
          <br />
          Fetch =&nbsp;
          {JSON.stringify(fetchFilter, null, 2)}
        </pre>
      </div>
    </div>
  );
}