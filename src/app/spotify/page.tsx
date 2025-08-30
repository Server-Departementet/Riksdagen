import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import getMinisters from "./functions/get-users";
import { Metadata } from "next";
import SpotifyContextProvider from "./context/spotify-context";

export const metadata: Metadata = {
  title: "Spotify-statistik",
  description: "Se statistik över ministrarnas Spotify-användning",
};

export default async function SpotifyPage() {
  // Auth check
  if (!(await isMinister())) return notFound();

  const [ministers] = await Promise.all([
    getMinisters(),
  ]);

  return (
    <main className={`px-0 lg:px-4`}>
      <h1 className="text-4xl mt-2">Spotify-statistik</h1>

      <section className={`
        flex flex-col sm:flex-row justify-center
        w-full
      `}>
        <SpotifyContextProvider users={Object.values(ministers)}>

        </SpotifyContextProvider>
      </section>
    </main>
  );
}