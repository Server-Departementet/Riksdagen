import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import FetchFilterContextProvider from "@/app/spotify/context/fetch-filter-context";
import LocalFilterContextProvider from "@/app/spotify/context/local-filter-context";
import FilterPanel from "@/app/spotify/components/filter-panel";
import TrackList from "@/app/spotify/components/track-list";
import getMinisters from "./functions/get-users";
import getAlbums from "./functions/get-albums";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spotify-statistik",
  description: "Se statistik över ministrarnas Spotify-användning",
};

export default async function SpotifyPage() {
  // Auth check
  if (!(await isMinister())) return notFound();

  const [users, albums] = await Promise.all([
    getMinisters(),
    getAlbums(),
  ])

  return (
    <main className={`
      px-0 lg:px-4
      sm:max-h-(--screen-height) sm:min-h-(--screen-height) sm:h-(--screen-height) sm:*:min-h-[inherit] sm:*:h-[inherit]
    `}>
      {/* Overwrite layout styling */}
      <style>{`footer{display:none;}main{padding:0;}`}</style>

      <section className={`
        flex flex-col sm:flex-row justify-center
        w-full
      `}>
        <FetchFilterContextProvider initialUsers={Object.values(users)}>
          <LocalFilterContextProvider>

            {/* Filter panel will set fetch filters for getting track ids. Local filters such as search will also live here */}
            <FilterPanel
              userMap={users}
              albums={albums}
              className="flex-1"
            />

            {/* Filtered tracks */}
            <TrackList className="flex-2" />

          </LocalFilterContextProvider>
        </FetchFilterContextProvider>
      </section>
    </main>
  );
}