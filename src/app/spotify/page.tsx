import { notFound } from "next/navigation";
import { Metadata } from "next";
import SpotifyContextProvider from "./context/spotify-context";
import TrackList from "./components/track-list";
import { getTracks } from "./functions/get-tracks";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { User } from "./types";
import { isMinister } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Spotify-statistik",
  description: "Se statistik över ministrarnas Spotify-användning",
};

const clerk = await clerkClient();
async function getMinisters(): Promise<Record<string, User>> {
  const allUsers = (await clerk.users.getUserList({ orderBy: "+created_at" })).data;
  const users = (await Promise.all(
    allUsers.map(async user => {
      if (user.publicMetadata["role"] !== "minister") return null;
      return { id: user.id, name: user.firstName || user.id };
    })
  )).filter(Boolean) as User[];

  const userMap: Record<string, User> = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  return userMap;
}

export default async function SpotifyPage() {
  // Auth check
  if (!(await isMinister(auth))) return notFound();

  const [ministers, tracks] = await Promise.all([
    getMinisters(),
    getTracks(),
  ]);

  // Shouldn't be any dupes but just in case
  const trackIds = [...new Set(tracks.map(t => t.id))];

  return (
    <main className={`px-0 lg:px-4`}>
      <h1 className="text-4xl mt-2">Spotify-statistik</h1>

      <section className={`
        flex flex-col sm:flex-row justify-center
        w-full
      `}>
        <SpotifyContextProvider
          users={Object.values(ministers)}
          trackIds={trackIds}
        >
          {/* <TrackList /> */}
        </SpotifyContextProvider>
      </section>
    </main>
  );
}