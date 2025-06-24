"use client";

import type { LocalFilterPacket } from "@/app/spotify/types";
import { createContext, useContext, useState } from "react";
import { defaultFetchFilter } from "@/app/spotify/context/fetch-filter-context";

export const defaultLocalFilter: LocalFilterPacket = {
  search: "",
  sort: defaultFetchFilter.sort,
  reverseOrder: false,
  album: {
    sort: {
      id: "name",
      reverseOrder: false,
    },
    include: [],
  }
}

export const LocalFilterContext = createContext<LocalFilterPacket>(defaultLocalFilter);
export const LocalFilterContextSetter = createContext<React.Dispatch<React.SetStateAction<LocalFilterPacket>>>(() => { });

export function useLocalFilterContext() {
  const localFilter = useContext(LocalFilterContext);
  const setLocalFilter = useContext(LocalFilterContextSetter);

  if (!localFilter || !setLocalFilter) {
    throw new Error("UseLocalFilterContext must be used within a LocalFilterContextProvider");
  }

  return { localFilter, setLocalFilter };
}

export default function LocalFilterContextProvider({ children }: { children: React.ReactNode }) {
  const [localFilter, setLocalFilter] = useState<LocalFilterPacket>(defaultLocalFilter);

  return (
    <LocalFilterContext.Provider value={localFilter}>
      <LocalFilterContextSetter.Provider value={setLocalFilter}>
        {children}
      </LocalFilterContextSetter.Provider>
    </LocalFilterContext.Provider>
  )
}