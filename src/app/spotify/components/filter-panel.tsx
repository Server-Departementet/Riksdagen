"use client";

import { UseFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { UseLocalFilterContext } from "@/app/spotify/context/local-filter-context";

export default function FilterPanel({ className = "" }: { className?: string }) {
  const { fetchFilter, setFetchFilter } = UseFetchFilterContext();
  const { localFilter, setLocalFilter } = UseLocalFilterContext();
  return (
    <div className={`
      flex flex-row justify-center sm:justify-end
      pt-5 px-6
      overflow-y-auto
      ${className}
    `}>
      {/* Nested divs in order to easily align everything toward the end of the container */}
      <div>
        <h1 className="text-3xl">Spotify-statistik</h1>

        <pre>
          Local =
          {JSON.stringify(localFilter, null, 2)}
          <br />
          <br />
          Fetch =
          {JSON.stringify(fetchFilter, null, 2)}
        </pre >
      </div>
    </div>
  );
}