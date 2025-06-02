"use client";

import { Button } from "@/components/ui/button";
import type { FetchFilterPacket, User } from "@/app/spotify/types";
import { createContext, useCallback, useContext, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export let defaultFilter: FetchFilterPacket = {
  sort: {
    label: "Lyssningstid",
    func: "playtime",
  },
  users: [],
  albums: { include: [], exclude: [] },
  artists: { include: [], exclude: [] },
  genres: { include: [], exclude: [] },
};

export const FilterContext = createContext<FetchFilterPacket>(defaultFilter);
export const FilterContextSetter = createContext<React.Dispatch<React.SetStateAction<FetchFilterPacket>>>(() => { });

export function useFilterContext() {
  const filter = useContext(FilterContext);
  const setFilter = useContext(FilterContextSetter);
  return { filter, setFilter };
}

export default function FilterContextProvider({ users, children }: { users: User[], children: React.ReactNode }) {
  defaultFilter = { ...defaultFilter, users: users.map(u => u.id) };
  const [activeFilter, setActiveFilter] = useState<FetchFilterPacket>(defaultFilter);

  return (
    <FilterContext.Provider value={activeFilter}>
      <FilterContextSetter.Provider value={setActiveFilter}>
        {children}
      </FilterContextSetter.Provider>
    </FilterContext.Provider>
  );
}

export function ResetFiltersButton() {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (typeof window === "undefined") return;

    // Strip arguments from URL
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.delete("sort");
    window.location.search = params.toString();
    router.refresh();
  }, [router]);

  return (
    <Button onClick={handleClick} variant={"link"} type="button" className="w-full hover:text-red-600">
      Återställ alla
      <Trash2Icon />
    </Button>
  );
}