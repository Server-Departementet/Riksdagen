"use client";

import type { LocalFilterPacket } from "@/app/spotify/types";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { createContext, useContext, useState } from "react";

export const defaultLocalFilter: LocalFilterPacket = {
  search: "",
  sort: sortingFunctions.default,
  reverseOrder: false,
}

export const LocalFilterContext = createContext<LocalFilterPacket>(defaultLocalFilter);
export const LocalFilterContextSetter = createContext<React.Dispatch<React.SetStateAction<LocalFilterPacket>>>(() => { });

export function UseLocalFilterContext() {
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