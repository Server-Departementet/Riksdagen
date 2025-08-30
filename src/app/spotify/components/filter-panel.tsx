import { sortingFunctions, SortingMethodNames, SortingMethod, type Album, type User } from "@/app/spotify/types";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import { useCallback, useMemo } from "react";
import { ChevronsUpDownIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import Image from "next/image";
import { useFilterContext } from "../context/filter-context";

export default function FilterPanel({
  userMap,
  className = ""
}: {
  userMap: Record<string, User>,
  className?: string
}) {
  const { filter, setFilter } = useFilterContext();

  let userToggleDebounceTimeout: NodeJS.Timeout | null = null;
  function handleUserToggle(value: string[]) {
    // Clear previous timeout if it exists
    if (userToggleDebounceTimeout) clearTimeout(userToggleDebounceTimeout);

    const userIds = value;
    const users = userIds.map(id => userMap[id]).filter(Boolean) as User[];

    // Set a new timeout to debounce the user toggle action
    userToggleDebounceTimeout = setTimeout(() => {
      setFilter(prev => ({
        ...prev,
        selectedUsers: users,
      }));
    }, 750);
  }

  let searchChangeDebounceTimeout: NodeJS.Timeout | null = null;
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Clear previous timeout if it exists
    if (searchChangeDebounceTimeout) clearTimeout(searchChangeDebounceTimeout);

    const searchValue = e.target.value;

    // Set a new timeout to debounce the search change action
    searchChangeDebounceTimeout = setTimeout(() => {
      setFilter(prev => ({
        ...prev,
        search: searchValue,
      }));
    }, 750);
  }

  let sortChangeDebounceTimeout: NodeJS.Timeout | null = null;
  function handleSortChange(value: string) {
    // Clear previous timeout if it exists
    if (sortChangeDebounceTimeout) clearTimeout(sortChangeDebounceTimeout);

    // Set a new timeout to debounce the sort change action
    sortChangeDebounceTimeout = setTimeout(() => {
      setFilter(prev => ({
        ...prev,
        sort: value as typeof prev.sort,
      }));
    }, 750);
  }

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
            defaultValue={filter.selectedUsers.map(u => u.id)}
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
          <Select defaultValue={filter.sort} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sortera..." />
            </SelectTrigger>

            <SelectContent>
              {Object.values(SortingMethod).map(method => (
                <SelectItem
                  key={`sorting-method-${method}`}
                  value={method}
                >
                  {SortingMethodNames[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reverse order */}
          <Button variant={"ghost"} size={"icon"} onClick={() => setFilter(prev => ({
            ...prev,
            reverse: !prev.reverse,
          }))}>
            {filter.reverse
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
            defaultValue={filter.search}
            onChange={handleSearchChange}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div >
  );
}