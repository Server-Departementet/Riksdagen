"use client";
import "client-only";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultFilter, Filter, SortingMethod, TrackWithStats, User } from "../types";
import { getFilteredTrackIDs, getTracksByIds } from "../functions/get-tracks";

type SpotifyContextType = {
  filter: Filter;
  users: User[]; // To make the filter panel and such
  tracks: TrackWithStats[]; // result of the filter
  allTrackIds: string[]; // All possible track ids (for filtering)
  selectedTrackIds: string[];
  lastFetchDuration: number; // ms it took to fetch the last batch of tracks
  resultCount: number; // Total number of tracks matching the filter
}
const defaultSpotifyContextState: SpotifyContextType = {
  filter: defaultFilter,
  users: [],
  tracks: [],
  allTrackIds: [],
  selectedTrackIds: [],
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
  trackIds,
  children
}: {
  users: User[];
  trackIds: string[];
  children?: React.ReactNode;
}) {
  const [spotifyContext, setSpotifyContext] = useState<SpotifyContextType>({
    ...defaultSpotifyContextState,
    users,
    allTrackIds: trackIds,
  });

  // On load, check if there are any params to set the filter from
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString().length) return;

    const search = params.get("q") || defaultFilter.search;
    const reverse = params.get("reverse") === "true" || defaultFilter.reverse;
    const sort = params.get("sort")
      ? (Object.values(SortingMethod).includes(params.get("sort") as SortingMethod) ? params.get("sort") : SortingMethod.Default)
      : defaultFilter.sort;
    const selectedUsers = params.get("users")
      ? users.filter(u => params.get("users")?.split(",").includes(u.id))
      : defaultFilter.selectedUsers;

    setSpotifyContext(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        search,
        reverse,
        selectedUsers,
        sort: sort as SortingMethod,
      }
    }));

    // Clear params from the URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [users]);

  // Fetch Tracks
  useEffect(() => {
    async function fetchTracks() {
      const startTime = performance.now();
      const filteredTrackIDs = await getFilteredTrackIDs(spotifyContext.filter);
      const endTime = performance.now();

      setSpotifyContext(prev => ({
        ...prev,
        selectedTrackIds: filteredTrackIDs,
        lastFetchDuration: Math.round(endTime - startTime),
        resultCount: filteredTrackIDs.length,
      }));

      // Fetch the first 50 tracks
      const filteredTrackData = await getTracksByIds(filteredTrackIDs.slice(0, 20));

      setSpotifyContext(prev => ({
        ...prev,
        tracks: filteredTrackData,
      }));
    }

    fetchTracks();
  }, [spotifyContext.filter]);

  return (
    <SpotifyContext.Provider value={spotifyContext}>
      <SpotifyContextSetter.Provider value={setSpotifyContext}>
        {children}
      </SpotifyContextSetter.Provider>
    </SpotifyContext.Provider>
  );
}