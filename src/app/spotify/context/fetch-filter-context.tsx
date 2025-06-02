import type { FetchFilterPacket } from "@/app/spotify/types";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { createContext, useContext } from "react";

export const defaultFetchFilter: FetchFilterPacket = {
  users: [],
  sort: sortingFunctions.default,
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

export function UseFetchFilterContext() {
  const fetchFilter = useContext(FetchFilterContext);
  const setFetchFilter = useContext(FetchFilterContextSetter);

  if (!fetchFilter || !setFetchFilter) {
    throw new Error("UseFetchFilterContext must be used within a FetchFilterContextProvider");
  }

  return { fetchFilter, setFetchFilter };
}

export function FetchFilterContextProvider({ children }: { children: React.ReactNode }) {
  const { fetchFilter, setFetchFilter } = UseFetchFilterContext();
  return (
    <FetchFilterContext.Provider value={fetchFilter}>
      <FetchFilterContextSetter.Provider value={setFetchFilter}>
        {children}
      </FetchFilterContextSetter.Provider>
    </FetchFilterContext.Provider>
  );
}