"use client";

import { Button } from "@/components/ui/button";
import { User } from "../types";
import { useFilterContext } from "../filter-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon, CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function UsersFilter({
  users,
}: {
  users: User[],
}) {
  const { filter, setFilter } = useFilterContext();
  let groupKeyIndex = 0;
  const [groupKey, setGroupKey] = useState<string>("users-filter-toggle-group-" + groupKeyIndex);
  const rerender = () => setGroupKey(() => { groupKeyIndex++; return "users-filter-toggle-group-" + groupKeyIndex })

  // Rerender options when filter changes
  useEffect(() => rerender, [filter]);

  const handleToggle = (value: string, user: User) => {
    if (value === "include") {
      setFilter((prev) => {
        return {
          ...prev, users: {
            exclude: prev.users.exclude.filter(u => u.id !== user.id),
            include: [
              ...prev.users.include,
              user,
            ]
          }
        }
      });
    }
    else if (value === "exclude") {
      setFilter((prev) => {
        return {
          ...prev, users: {
            include: prev.users.include.filter(u => u.id !== user.id),
            exclude: [
              ...prev.users.exclude,
              user,
            ]
          }
        }
      });
    }
    else {
      setFilter((prev) => {
        return {
          ...prev, users: {
            include: prev.users.include.filter(u => u.id !== user.id),
            exclude: prev.users.exclude.filter(u => u.id !== user.id),
          }
        }
      });
    }
    rerender();
  };

  const handleClear = () => {
    setFilter((prev) => ({
      ...prev,
      users: {
        include: [],
        exclude: [],
      },
    }));
    rerender();
  };

  return (
    <section className="flex flex-col justify-start items-center">
      <h5 className="text-center">Användare</h5>

      <ul className="w-full flex flex-col gap-y-1">
        {users.map((user, i) => {
          const isIncluded = filter.users.include.some(u => u.id === user.id);
          const isExcluded = filter.users.exclude.some(u => u.id === user.id);
          return (
            <li className="flex flex-row justify-between items-center" key={`${user.id}-${i}-user-filter`}>
              <span className="flex-1">
                {user.name}
              </span>

              <ToggleGroup key={groupKey} className="flex flex-row justify-between items-center" type="single" defaultValue={isIncluded ? "include" : isExcluded ? "exclude" : "none"} onValueChange={(value) => handleToggle(value, user)}>
                <ToggleGroupItem value="exclude" className="text-red-600 hover:text-red-600 hover:bg-zinc-300 data-[state=on]:bg-red-700 data-[state=on]:text-zinc-50"><BanIcon className="text-inherit" /></ToggleGroupItem>
                <ToggleGroupItem value="include" className="text-green-600 hover:text-green-600 hover:bg-zinc-300 data-[state=on]:bg-green-600 data-[state=on]:text-zinc-50"><CheckIcon className="text-inherit" /></ToggleGroupItem>
              </ToggleGroup>
            </li>
          )
        })}
      </ul>

      {/* Clear */}
      <Button onClick={handleClear} className="text-sm opacity-80" variant={"link"} type="button">Rensa</Button>
    </section >
  );
}