"use client";

import type { FetchFilterPacket, User } from "@/app/spotify/types";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { createContext, useContext, useState } from "react";

export const defaultFetchFilter: FetchFilterPacket = {
  users: [],
  sort: sortingFunctions.play_count.id,
  reverseOrder: false,
  albums: {
    include: [],
    exclude: [],
  },
  artists: {
    include: [],
    exclude: [],
  },
  genres: {
    include: [],
    exclude: [],
  },
}

export const FetchFilterContext = createContext<FetchFilterPacket>(defaultFetchFilter);
export const FetchFilterContextSetter = createContext<React.Dispatch<React.SetStateAction<FetchFilterPacket>>>(() => { });

export function useFetchFilterContext() {
  const fetchFilter = useContext(FetchFilterContext);
  const setFetchFilter = useContext(FetchFilterContextSetter);

  if (!fetchFilter || !setFetchFilter) {
    throw new Error("UseFetchFilterContext must be used within a FetchFilterContextProvider");
  }

  return { fetchFilter, setFetchFilter };
}

export default function FetchFilterContextProvider({ children, initialUsers }: { children: React.ReactNode, initialUsers: User[] }) {
  const [fetchFilter, setFetchFilter] = useState<FetchFilterPacket>({
    ...defaultFetchFilter,
    users: initialUsers,
  });

  return (
    <FetchFilterContext.Provider value={fetchFilter}>
      <FetchFilterContextSetter.Provider value={setFetchFilter}>
        {children}
      </FetchFilterContextSetter.Provider>
    </FetchFilterContext.Provider>
  );
}