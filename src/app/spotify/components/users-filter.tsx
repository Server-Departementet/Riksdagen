"use client";

import type { User } from "@/app/spotify/types";
import { Button } from "@/components/ui/button";
import { useFilterContext } from "@/app/spotify/filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon, CheckIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function UsersFilter({ users }: { users: User[] }) {
  const { filter, setFilter } = useFilterContext();
  let groupKeyIndex = 0;
  const [groupKey, setGroupKey] = useState<string>("users-filter-toggle-group-" + groupKeyIndex);
  const rerender = useCallback(() => setGroupKey(() => { groupKeyIndex++; return "users-filter-toggle-group-" + groupKeyIndex }), [groupKeyIndex]);

  // Rerender options when filter changes
  useEffect(() => rerender, [filter, rerender]);

  const handleToggle = useCallback((value: string, userId: string) => {
    if (value === "include") {
      setFilter((prev) => {
        return {
          ...prev, users: {
            exclude: prev.users.exclude.filter(u => u !== userId),
            include: [
              ...prev.users.include,
              userId,
            ]
          }
        }
      });
    }
    else if (value === "exclude") {
      setFilter((prev) => {
        return {
          ...prev, users: {
            include: prev.users.include.filter(u => u !== userId),
            exclude: [
              ...prev.users.exclude,
              userId,
            ]
          }
        }
      });
    }
    else {
      setFilter((prev) => {
        return {
          ...prev, users: {
            include: prev.users.include.filter(u => u !== userId),
            exclude: prev.users.exclude.filter(u => u !== userId),
          }
        }
      });
    }
    rerender();
  }, [rerender, setFilter]);

  const handleClear = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      users: {
        include: [],
        exclude: [],
      },
    }));
    rerender();
  }, [rerender, setFilter]);

  return (
    <div className="flex flex-col justify-start items-center">
      <h5 className="text-center">Användare</h5>

      <ul className="w-full flex flex-col gap-y-1">
        {users.map((user, i) => {
          const isIncluded = filter.users.include.some(u => u === user.id);
          const isExcluded = filter.users.exclude.some(u => u === user.id);
          return (
            <li className="flex flex-row justify-between items-center" key={`${user}-${i}-user-filter`}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="flex-1 text-start text-ellipsis overflow-hidden">
                  {user.name}
                </TooltipTrigger>
                <TooltipContent>
                  {user.name}
                </TooltipContent>
              </Tooltip>

              <ToggleGroup
                key={groupKey}
                className="flex flex-row justify-between items-center"
                type="single"
                defaultValue={isIncluded ? "include" : isExcluded ? "exclude" : "none"}
                onValueChange={(value) => handleToggle(value, user.id)}
              >
                <ToggleGroupItem value="exclude" className="text-red-600 hover:text-red-600 hover:bg-zinc-300 data-[state=on]:bg-red-700 data-[state=on]:text-zinc-50"><BanIcon className="text-inherit" /></ToggleGroupItem>
                <ToggleGroupItem value="include" className="text-green-600 hover:text-green-600 hover:bg-zinc-300 data-[state=on]:bg-green-600 data-[state=on]:text-zinc-50"><CheckIcon className="text-inherit" /></ToggleGroupItem>
              </ToggleGroup>
            </li>
          )
        })}
      </ul>

      {/* Clear */}
      <Button onClick={handleClear} className="text-sm opacity-80" variant={"link"} type="button">Rensa</Button>
    </div >
  );
}