import { notFound } from "next/navigation";
import { Metadata } from "next";
import SpotifyContextProvider from "./context/spotify-context";
import TrackList from "./components/track-list";
import { getTracks } from "./functions/get-tracks";
import { auth } from "@clerk/nextjs/server";
import { getMinisterMap, isMinister } from "@/lib/auth";
import FilterPanel from "./components/filter-panel";

export const metadata: Metadata = {
  title: "Spotify-statistik",
  description: "Se statistik över ministrarnas Spotify-användning",
};

export default async function SpotifyPage() {
  // Auth check
  if (!isMinister((await auth()).userId)) return notFound();

  const [ministers, tracks] = await Promise.all([
    getMinisterMap(),
    getTracks(),
  ]);

  // Shouldn't be any dupes but just in case
  const trackIds = [...new Set(tracks.map(t => t.id))];

  return (
    <main className={`px-0 lg:px-4 h-screen max-h-screen`}>
      <h1 className="text-4xl mt-2">Spotify-statistik</h1>

      <section className={`
        flex flex-col sm:flex-row 
        justify-end lg:justify-center
        w-full
      `}>
        <SpotifyContextProvider
          users={Object.values(ministers)}
          trackIds={trackIds}
        >
          <FilterPanel />

          <TrackList />
        </SpotifyContextProvider>
      </section>
    </main>
  );
}