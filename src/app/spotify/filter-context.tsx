import { createContext } from "react";

export const FilterContext = createContext<>();

export function FilterContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}