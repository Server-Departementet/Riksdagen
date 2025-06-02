import type { User } from "@/app/spotify/types";
import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import FetchFilterContextProvider from "@/app/spotify/context/fetch-filter-context";
import LocalFilterContextProvider from "@/app/spotify/context/local-filter-context";
import FilterPanel from "@/app/spotify/components/filter-panel";
import TrackList from "@/app/spotify/components/track-list";

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
    <main className={`
      px-0 lg:px-4 
      md:max-h-(--screen-height) md:min-h-(--screen-height) md:h-(--screen-height) md:*:min-h-[inherit] md:*:h-[inherit]
    `}>
      {/* Overwrite layout styling */}
      <style>{`footer{display:none;}main{padding:0;}`}</style>

      <section className={`
        flex flex-row justify-center
        w-full
        gap-x-10
      `}>
        <FetchFilterContextProvider>
          <LocalFilterContextProvider>

            {/* Filter panel will set fetch filters for getting track ids. Local filters such as search will also live here */}
            <FilterPanel className="flex-1" />

            {/* Filtered tracks */}
            <TrackList className="flex-2" />

          </LocalFilterContextProvider>
        </FetchFilterContextProvider>
      </section>
    </main>
  );
}