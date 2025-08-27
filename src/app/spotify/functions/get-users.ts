import { clerkClient } from "@clerk/nextjs/server";
import { User } from "../types";
import { isMinister } from "@/lib/auth";

const clerk = await clerkClient();

export default async function getMinisters(): Promise<Record<string, User>> {
  "use cache";

  const allUsers = (await clerk.users.getUserList({ orderBy: "+created_at" })).data;
  const users = (await Promise.all(
    allUsers.map(async user => {
      const isMinisterUser = await isMinister(user.id);
      return isMinisterUser ? { id: user.id, name: user.firstName || user.id } : null;
    })
  )).filter(Boolean) as User[];

  const userMap: Record<string, User> = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  return userMap;
}