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
  }));
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

export function isMinister(userId: string | null): boolean {
  if (!userId) return false;
  return ministers.some(m => m.id === userId);
}