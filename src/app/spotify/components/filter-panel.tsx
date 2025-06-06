"use client";

import type { User } from "@/app/spotify/types";
import { useFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { UseLocalFilterContext } from "@/app/spotify/context/local-filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCallback } from "react";

export default function FilterPanel({ userMap, className = "" }: { userMap: Record<string, User>, className?: string }) {
  const { fetchFilter, setFetchFilter } = useFetchFilterContext();
  const { localFilter, setLocalFilter } = UseLocalFilterContext();

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

        {/* Search filter */}
        <div className="w-full flex flex-col items-center px-3">
          <input
            type="text"
            placeholder="Sök efter låtar..."
            defaultValue={localFilter.search}
            onChange={handleSearchChange}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <pre>
          Local =
          {JSON.stringify(localFilter, null, 2)}
          <br />
          <br />
          Fetch =
          {JSON.stringify(fetchFilter, null, 2)}
        </pre>
      </div>
    </div>
  );
}