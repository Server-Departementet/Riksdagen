"use client";

import { createContext, useContext, useState } from "react";
import { defaultFilter, Filter, TrackWithStats, User } from "../types";

type SpotifyContextType = {
  filer: Filter;
  users: User[]; // To make the filter panel and such
  tracks: TrackWithStats[]; // result of the filter
  trackIds: string[];
}
const defaultSpotifyContextState: SpotifyContextType = {
  filer: defaultFilter,
  users: [],
  tracks: [],
  trackIds: [],
};

export const SpotifyContext = createContext<SpotifyContextType>(defaultSpotifyContextState);
export const SpotifyContextSetter = createContext<React.Dispatch<React.SetStateAction<SpotifyContextType>>>(() => { });

export function useSpotifyContext() {
  const spotifyContext = useContext(SpotifyContext);
  const setSpotifyContext = useContext(SpotifyContextSetter);

  if (!spotifyContext || !setSpotifyContext) {
    throw new Error("UseSpotifyContext must be used within a SpotifyContextProvider");
  }

  return { spotifyContext, setSpotifyContext };
}

export default function SpotifyContextProvider({
  users,
  trackIds, // Used for children to fetch
  children
}: {
  users: User[];
  trackIds: string[];
  children?: React.ReactNode;
}) {
  const [spotifyContext, setSpotifyContext] = useState<SpotifyContextType>({
    ...defaultSpotifyContextState,
    users,
    trackIds,
  });

  return (
    <SpotifyContext.Provider value={spotifyContext}>
      <SpotifyContextSetter.Provider value={setSpotifyContext}>
        {children}
      </SpotifyContextSetter.Provider>
    </SpotifyContext.Provider>
  );
}