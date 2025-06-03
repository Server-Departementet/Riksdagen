"use client";

import type { User } from "@/app/spotify/types";
import { useFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { UseLocalFilterContext } from "@/app/spotify/context/local-filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCallback } from "react";

export default function FilterPanel({ userMap, className = "" }: { userMap: Record<string, User>, className?: string }) {
  const { fetchFilter, setFetchFilter } = useFetchFilterContext();
  const { localFilter, setLocalFilter } = UseLocalFilterContext();

  const handleUserToggle = useCallback((value: string[]) => {
    const userIds = value;
    const users = userIds.map(id => userMap[id]).filter(Boolean) as User[];

    setFetchFilter(prev => ({
      ...prev,
      users,
    }));
  }, [setFetchFilter, userMap]);

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

        <pre>
          Local =
          {JSON.stringify(localFilter, null, 2)}
          <br />
          <br />
          Fetch =
          {JSON.stringify(fetchFilter, null, 2)}
        </pre >
      </div>
    </div>
  );
}