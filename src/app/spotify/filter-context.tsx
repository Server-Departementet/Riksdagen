"use client";

import { createContext, useState } from "react";
import { FilterPacket } from "./types";

const defaultFilter: FilterPacket = {
  sorting: {
    label: "Lyssningstid",
    sortBy: "playtime",
  },
};

export const FilterContext = createContext<FilterPacket>(defaultFilter);
export const FilterContextSetter = createContext<React.Dispatch<React.SetStateAction<FilterPacket>>>(() => { });

export function FilterContextProvider({ children }: { children: React.ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<FilterPacket>(defaultFilter);

  return (
    <FilterContext.Provider value={activeFilter}>
      <FilterContextSetter.Provider value={setActiveFilter}>
        {children}
      </FilterContextSetter.Provider>
    </FilterContext.Provider>
  );
}