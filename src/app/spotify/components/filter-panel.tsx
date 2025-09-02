"use client";
import { useSpotifyContext } from "../context/spotify-context";

export default function FilterPanel() {
  const { spotifyContext: { filter } } = useSpotifyContext();
  return (
    <aside className={``}>
      

      <pre className="h-0">{JSON.stringify(filter, null, 2)}</pre>
    </aside>
  );
}