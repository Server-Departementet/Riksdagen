"use client";
import "client-only";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultFilter, Filter, TrackWithStats, User } from "../types";
import { getFilteredTracks } from "../functions/get-tracks";

type SpotifyContextType = {
  filter: Filter;
  users: User[]; // To make the filter panel and such
  tracks: TrackWithStats[]; // result of the filter
  trackIds: string[];
  lastFetchDuration: number; // ms it took to fetch the last batch of tracks
  resultCount: number; // Total number of tracks matching the filter
}
const defaultSpotifyContextState: SpotifyContextType = {
  filter: defaultFilter,
  users: [],
  tracks: [],
  trackIds: [],
  lastFetchDuration: 0,
  resultCount: 0,
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
  const loadIncrement = 50;
  const [visibleTracks, setVisibleTracks] = useState<number>(loadIncrement);

  // Allow more fetch on scroll
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

      const startTime = performance.now(); // Stats

      const newTracks = await getFilteredTracks(spotifyContext.filter);

      const endTime = performance.now(); // Stats
      const fetchTime = Math.round(endTime - startTime); // Stats

      setSpotifyContext((prev) => ({
        ...prev,
        tracks: [...prev.tracks, ...newTracks],
        lastFetchDuration: fetchTime, // Stats
        resultCount: trackIds.length, // Stats TODO: This should be the filtered count 
      }));
    })();
  }, [visibleTracks, trackIds, loadedTracks.length, spotifyContext.filter]);

  return (
    <SpotifyContext.Provider value={spotifyContext}>
      <SpotifyContextSetter.Provider value={setSpotifyContext}>
        {children}
      </SpotifyContextSetter.Provider>
    </SpotifyContext.Provider>
  );
}