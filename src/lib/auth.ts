import "server-only";
import type { Session } from "@/lib/session";
import { getSession } from "@/lib/session";

/** The current session, or null when not logged in. */
export async function auth(): Promise<Session | null> {
  return await getSession();
}

export async function isMinister(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "minister";
}
