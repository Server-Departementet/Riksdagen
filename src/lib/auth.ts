"use server";
import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

const clerk = await clerkClient();

const authedRoles = ["minister"] as const;

export async function isMinister(userId: string): Promise<boolean> {
  if (!userId) return false;

  const user = await clerk.users.getUser(userId);
  if (!user) return false;
  if (!user.publicMetadata.role) return false;
  return authedRoles.includes(user.publicMetadata.role as typeof authedRoles[number]);
}
