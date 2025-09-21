"use client";
import "client-only";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultFilter, Filter, SortingMethod, TrackWithStats, User } from "../types";
import { getFilteredTrackIDs, getTracksByIds } from "../functions/get-tracks";

type SpotifyContextType = {
  filter: Filter;
  users: User[]; // To make the filter panel and such
  allTrackData: TrackWithStats[]; // result of the filter
  allTrackIds: string[]; // All possible track ids (for filtering)
  resultingTrackIds: string[];
  lastFetchDuration: number; // ms it took to fetch the last batch of tracks
  resultCount: number; // Total number of tracks matching the filter
}
const defaultSpotifyContextState: SpotifyContextType = {
  filter: defaultFilter,
  users: [],
  allTrackData: [],
  allTrackIds: [],
  resultingTrackIds: [],
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
  const [hasParsedParams, setHasParsedParams] = useState(false);
  const [spotifyContext, setSpotifyContext] = useState<SpotifyContextType>({
    ...defaultSpotifyContextState,
    users,
    allTrackIds: trackIds,
  });
  const [visibleTrackCount, setVisibleTrackCount] = useState(20);

  // On load, check if there are any params to set the filter from
  useEffect(() => {
    if (hasParsedParams) return;
    setHasParsedParams(true);
    if (typeof window === "undefined") return;

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
  }, [hasParsedParams, users]);

  // Fetch Tracks
  useEffect(() => {
    async function fetchTracks() {
      const startTime = performance.now();
      const resultingTrackIds = await getFilteredTrackIDs(spotifyContext.filter);
      console.log(resultingTrackIds.length);
      const endTime = performance.now();

      setSpotifyContext(prev => ({
        ...prev,
        resultingTrackIds,
        lastFetchDuration: Math.round(endTime - startTime),
        resultCount: resultingTrackIds.length,
      }));

      const nonFetchedTrackIds = resultingTrackIds
        .slice(0, visibleTrackCount)
        .filter(id => !spotifyContext.allTrackData.find(t => t.id === id));

      if (nonFetchedTrackIds.length) {
        const fetchedTracks = await getTracksByIds(nonFetchedTrackIds);
        setSpotifyContext(prev => ({
          ...prev,
          allTrackData: [...prev.allTrackData, ...fetchedTracks],
        }));
      }
    }

    fetchTracks();
  }, [spotifyContext.filter, spotifyContext.allTrackData, visibleTrackCount]);

  return (
    <SpotifyContext.Provider value={spotifyContext}>
      <SpotifyContextSetter.Provider value={setSpotifyContext}>
        {children}
      </SpotifyContextSetter.Provider>
    </SpotifyContext.Provider>
  );
}