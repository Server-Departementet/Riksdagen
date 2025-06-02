import type { User } from "@/app/spotify/types";
import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { FetchFilterContextProvider } from "@/app/spotify/context/fetch-filter-context";
import { LocalFilterContextProvider } from "@/app/spotify/context/local-filter-context";

const clerk = await clerkClient();

export default async function SpotifyPage() {
  // Auth check
  // if (!(await isMinister())) return notFound();

  const allUsers = (await clerk.users.getUserList({ orderBy: "+created_at" })).data;
  const ministerChecks = await Promise.all(allUsers.map(user => isMinister(user.id)));
  const users: User[] = allUsers
    .filter((_, i) => ministerChecks[i])
    .map(user => ({ id: user.id, name: user.firstName || user.id }));

  return (
    <main className="px-0 lg:px-4">
      {/* Overwrite layout styling */}
      <style>{`footer{display:none;}main{padding:0;}`}</style>

      <section>
        <FetchFilterContextProvider>
          <LocalFilterContextProvider>
            <h1>Spotify-statistik</h1>

            {/* Filter panel will set fetch filters for getting track ids. Local filters such as search will also live here */}
            {/* <FilterPanel /> */}

            {/* Filtered tracks */}
            {/* <TrackList /> */}

          </LocalFilterContextProvider>
        </FetchFilterContextProvider>
      </section>
    </main>
  );
}
