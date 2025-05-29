import type { User } from "@/app/spotify/types";
import FilterContextProvider from "@/app/spotify/filter-context";
import FilterPanel from "@/app/spotify/components/filter-panel";
import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import TrackList from "@/app/spotify/components/track-list";

const clerk = await clerkClient();

export default async function SpotifyPage() {
  // Auth check
  if (!(await isMinister())) return notFound();

  const allUsers = (await clerk.users.getUserList({ orderBy: "+created_at" })).data;
  const ministerChecks = await Promise.all(allUsers.map(user => isMinister(user.id)));
  const users: User[] = allUsers
    .filter((_, i) => ministerChecks[i])
    .map(user => ({ id: user.id, name: user.firstName || user.id }));

  return (
    <main className="px-0 lg:px-4">
      {/* Overwrite layout styling */}
      <style>{`footer{display:none;}`}</style>

      <FilterContextProvider users={users}>
        <section className={`
          md:max-h-(--screen-height) md:min-h-(--screen-height) md:h-(--screen-height) md:*:min-h-[inherit] md:*:h-[inherit] 
          w-full lg:w-11/12 
          flex flex-col md:flex-row
          items-center md:items-start
        `}>
          <FilterPanel users={users} />

          <TrackList />
        </section>
      </FilterContextProvider>
    </main>
  );
}
