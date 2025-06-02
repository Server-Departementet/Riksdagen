"use client";

import { UseFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { UseLocalFilterContext } from "@/app/spotify/context/local-filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function FilterPanel({ className = "" }: { className?: string }) {
  const { fetchFilter, setFetchFilter } = UseFetchFilterContext();
  const { localFilter, setLocalFilter } = UseLocalFilterContext();
  return (
    <div className={`
      flex flex-row justify-center sm:justify-end
      pt-5 px-6
      overflow-y-auto
      ${className}
    `}>
      {/* Nested divs in order to easily align everything toward the end of the container */}
      <div className="flex flex-col gap-y-2 overflow-x-hidden">
        <h1 className="text-3xl">Spotify-statistik</h1>

        {/* User filter */}
        <div className="w-full flex flex-col items-center">
          <ToggleGroup
            type="multiple"
            className="w-fit flex-col *:w-full"
            defaultValue={fetchFilter.users.map(u => u.id)}
          >
            {fetchFilter.users.map(u => {
              return (
                <ToggleGroupItem
                  value={u.id}
                  key={`user-${u.id}`}
                  className={`
                    bg-zinc-100 
                    aria-pressed:!bg-gray-600 aria-pressed:!text-white
                    first:rounded-none first:rounded-tl-lg first:rounded-tr-lg 
                    last:rounded-none last:rounded-bl-lg last:rounded-br-lg
                    first:pt-0.5 last:pb-0.5
                    px-1.5 py-0.5
                  `}
                >
                  {u.name}
                </ToggleGroupItem>
              )
            })}
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