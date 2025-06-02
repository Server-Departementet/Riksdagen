"use client";

import { UseFetchFilterContext } from "@/app/spotify/context/fetch-filter-context";
import { UseLocalFilterContext } from "@/app/spotify/context/local-filter-context";

export default function FilterPanel({ className = "" }: { className?: string }) {
  const { fetchFilter, setFetchFilter } = UseFetchFilterContext();
  const { localFilter, setLocalFilter } = UseLocalFilterContext();
  return (
    <div className={`
      flex flex-row justify-end
      ${className}
    `}>
      <pre>
        Local =
        {JSON.stringify(localFilter, null, 2)}
        <br />
        <br />
        Fetch =
        {JSON.stringify(fetchFilter, null, 2)}
      </pre >
    </div>
  );
}