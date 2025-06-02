import type { FetchFilterPacket } from "@/app/spotify/types";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { createContext } from "react";

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
export const FetchFilterContextSetter = createContext<React.Dispatch<React.SetStateAction<FetchFilterPacket>> | null>(null);

export function FetchFilterContextProvider({ children }: { children: React.ReactNode }) {

}