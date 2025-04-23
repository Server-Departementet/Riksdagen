"use client";

import { Button } from "@/components/ui/button";
import type { FilterPacket, User } from "./types";
import { createContext, useCallback, useContext, useState } from "react";
import { Trash2Icon } from "lucide-react";

let defaultFilter: FilterPacket = {
  sorting: {
    label: "Lyssningstid",
    sortBy: "playtime",
  },
  albums: { include: [], exclude: [] },
  artists: { include: [], exclude: [] },
  genres: { include: [], exclude: [] },
  users: { include: [], exclude: [] },
};

export const FilterContext = createContext<FilterPacket>(defaultFilter);
export const FilterContextSetter = createContext<React.Dispatch<React.SetStateAction<FilterPacket>>>(() => { });

export function useFilterContext() {
  const filter = useContext(FilterContext);
  const setFilter = useContext(FilterContextSetter);
  return { filter, setFilter };
}

export function FilterContextProvider({ users, children }: { users: User[], children: React.ReactNode }) {
  defaultFilter = { ...defaultFilter, users: { include: users, exclude: [] } };
  const [activeFilter, setActiveFilter] = useState<FilterPacket>(defaultFilter);

  return (
    <FilterContext.Provider value={activeFilter}>
      <FilterContextSetter.Provider value={setActiveFilter}>
        {children}
      </FilterContextSetter.Provider>
    </FilterContext.Provider>
  );
}

export function ResetFiltersButton() {
  const { setFilter } = useFilterContext();
  const handleClick = useCallback(() => {
    setFilter(defaultFilter);
  }, [setFilter]);

  return (
    <Button onClick={handleClick} variant={"link"} type="button" className="w-full hover:text-red-600">
      Återställ alla
      <Trash2Icon />
    </Button>
  );
}