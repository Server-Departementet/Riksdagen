"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";

const clerk = await clerkClient();

const authedRoles = ["minister"] as const;

export async function isMinister(userId?: string): Promise<boolean> {
  if (userId) {
    const user = await clerk.users.getUser(userId);
    if (!user) return false;
    if (!user.publicMetadata.role) return false;
    return authedRoles.includes(user.publicMetadata.role as typeof authedRoles[number]);
  } else {
    const user = await currentUser();
    if (!user) return false;
    if (!user.publicMetadata.role) return false;
    return authedRoles.includes(user.publicMetadata.role as typeof authedRoles[number]);
  }
}