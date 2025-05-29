import type { User } from "@/app/spotify/types";
import { ResetFiltersButton } from "@/app/spotify/filter-context";
import { UsersFilter } from "@/app/spotify/components/users-filter";

export default function FilterPanel({ users }: { users: User[] }) {
  return (
    <aside className={`
      min-w-[20ch] max-w-11/12 md:max-w-[30ch]
      flex-1
      px-5 pt-4 p-2 
      flex flex-col gap-y-2
    `}>
      <h3>Filter</h3>

      <ResetFiltersButton />

      <hr className="my-2" />

      {/* User select */}
      <UsersFilter users={users} />

      <hr className="my-2" />

      {/* Spacer */}
      <span className="flex-1"></span>

      <p className="text-center text-sm opacity-80">© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>

      {/* 
        Notes:
        Reset

        Which users
        Searchable multi-select inclusive/exclusive. select/unselect all buttons

        What results are shown, tracks | artists | album


        Track filters

        Sorting:
        - playtime (d & a),
        - play count (d & a),
        - track length (d & a),
        - track name (a & d),
        - artist name (a & d), // Should probably combine with another sorting method
        - played at. unique tracks mapped to the latest played track play's time (d & a),
        - plays / time. Play frequency (d & a),
        - plays / artist. Artist popularity (d & a),

        Genre:
        Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

        Artist:
        Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

        Album:
        Searchable multi-select. Check as inclusive or exclusive. "select/unselect all" buttons

        Listened date range:
        Slider + inputs on ends. "start date" and "end date"

        Listened count range:
        Slider + inputs on ends. "min count" and "max count"

        Track length range:
        Slider + inputs on ends. "min length" and "max length"



        Artist filters

        Sorting:
        - playtime (d & a),
        - play count (d & a),
        - track count (d & a),
        - artist name (a & d),
        - played at. latest track play mapped to artists (d & a),
      */}
    </aside>
  );
}