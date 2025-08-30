"use client";

import { defaultFilter, Filter, User } from "@/app/spotify/types";
import { createContext, useContext, useState } from "react";

export const FilterContext = createContext<Filter>(defaultFilter);
export const FilterContextSetter = createContext<React.Dispatch<React.SetStateAction<Filter>>>(() => { });

export function useFilterContext() {
  const filter = useContext(FilterContext);
  const setFilter = useContext(FilterContextSetter);

  if (!filter || !setFilter) {
    throw new Error("UseFilterContext must be used within a FilterContextProvider");
  }

  return { filter, setFilter };
}

export default function FilterContextProvider({ children, users }: { children?: React.ReactNode, users: User[] }) {
  const [filter, setFilter] = useState<Filter>({
    ...defaultFilter,
    selectedUsers: users,
  });

  return (
    <FilterContext.Provider value={filter}>
      <FilterContextSetter.Provider value={setFilter}>
        {children}
      </FilterContextSetter.Provider>
    </FilterContext.Provider>
  );
}