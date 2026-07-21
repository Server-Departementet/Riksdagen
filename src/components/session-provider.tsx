"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/lib/session";

const SessionContext = createContext<Session | null>(null);

export function SessionProvider(
  {
    session,
    children,
  }: {
    session: Session | null,
    children: React.ReactNode,
  },
) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/** The current session, or null when not logged in. Client components only. */
export function useSession(): Session | null {
  return useContext(SessionContext);
}
