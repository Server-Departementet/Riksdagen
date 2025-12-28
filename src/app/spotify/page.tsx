import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth, clerkClient, User } from "@clerk/nextjs/server";

export default async function SpotifyPage() {
  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  const clerk = await clerkClient();

  const allUsers = (await clerk.users.getUserList({ limit: 100 })).data;
  const ministers: User[] = [];
  await Promise.all(allUsers.map(async u => {
    if (await isMinister(u.id)) ministers.push(u);
  }));

  return <main>

  </main>;
}