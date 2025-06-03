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
        <FetchFilterContextProvider initialUsers={users}>
          <LocalFilterContextProvider>

            {/* Filter panel will set fetch filters for getting track ids. Local filters such as search will also live here */}
            <FilterPanel userMap={userMap} className="flex-1" />

            {/* Filtered tracks */}
            <TrackList className="flex-2" />

          </LocalFilterContextProvider>
        </FetchFilterContextProvider>
      </section>
    </main>
  );
}