"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultFilter, Filter, TrackWithStats, User } from "../types";
import { getTracks } from "../functions/get-tracks";

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

  const [loadedTracks, setLoadedTracks] = useState<string[]>([]); // To avoid fetching the same tracks again
  const loadIncrement = 100;
  const [visibleTracks, setVisibleTracks] = useState<number>(loadIncrement);

  // Fetch on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        setVisibleTracks((prev) => prev + loadIncrement);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch tracks when visibleTracks changes
  useEffect(() => {
    (async () => {
      const newTrackIds = trackIds.slice(loadedTracks.length, visibleTracks);
      if (newTrackIds.length === 0) return;

      setLoadedTracks((prev) => [...new Set([...prev, ...newTrackIds])]);

      const newTracks = await getTracks(newTrackIds);

      setSpotifyContext((prev) => ({
        ...prev,
        tracks: [...prev.tracks, ...newTracks],
      }));
    })();
  }, [visibleTracks, trackIds, loadedTracks.length]);

  return (
    <SpotifyContext.Provider value={spotifyContext}>
      <SpotifyContextSetter.Provider value={setSpotifyContext}>
        {children}
      </SpotifyContextSetter.Provider>
    </SpotifyContext.Provider>
  );
}