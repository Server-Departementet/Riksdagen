import { createContext } from "react";


const FilterContext = createContext<null>(null);


export function FilterContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}