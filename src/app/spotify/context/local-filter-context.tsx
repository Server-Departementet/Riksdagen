import type { LocalFilterPacket } from "@/app/spotify/types";
import { sortingFunctions } from "@/app/spotify/functions/track-sorting";
import { createContext } from "react";

export const defaultLocalFilter: LocalFilterPacket = {
  search: "",
  sort: sortingFunctions.default,
  reverseOrder: false,
}

export const LocalFetchFilterContext = createContext<LocalFilterPacket>(defaultLocalFilter);
export const LocalFetchFilterContextSetter = createContext<React.Dispatch<React.SetStateAction<LocalFilterPacket>> | null>(null);

export function LocalFilterContextProvider({ children }: { children: React.ReactNode }) {

}