import { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import "server-only";

export async function isMinister(auth: ClerkMiddlewareAuth): Promise<boolean> {
  return hasRole(auth, "minister");
}

export async function hasRole(auth: ClerkMiddlewareAuth, role: string): Promise<boolean> {
  return ((await auth.protect()).sessionClaims["metadata"] as { role: string })["role"] == role;
}