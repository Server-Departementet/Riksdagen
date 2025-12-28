import "server-only";
import { User } from "@/app/spotify/types";
import { clerkClient } from "@clerk/nextjs/server";

// TODO - refetch every now and then
const clerk = await clerkClient();
const usersRes = await clerk.users.getUserList();
const ministers: User[] = usersRes.data
  .filter(u => u.publicMetadata.role === "minister")
  .map(u => ({
    id: u.id,
    name: u.firstName || "Okänt namn",
  }))
  .reverse();
const ministerMap = Object.fromEntries(ministers.map(m => [m.id, m]));
const userIds = Object.keys(ministerMap);

export function getMinisters(): User[] {
  return ministers;
}
export function getMinisterMap(): Record<string, User> {
  return ministerMap;
}
export function getMinisterIds(): string[] {
  return userIds;
}

const authedRoles = ["minister"] as const;

export async function isMinister(userId: string): Promise<boolean> {
  if (!userId) return false;

  const user = await clerk.users.getUser(userId);
  if (!user) return false;
  if (!user.publicMetadata.role) return false;
  return authedRoles.includes(user.publicMetadata.role as typeof authedRoles[number]);
}