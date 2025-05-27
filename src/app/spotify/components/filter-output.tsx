"use client";

import { useEffect, useState, useRef } from "react";
import { useFilterContext } from "../filter-context";
import { Track } from "../types";
import { Artist } from "@prisma/client";

/**
 * Data flow: the filter from the context is sent to the server and you receive a list of track IDs.
 * Then fetch the track data from the server asynchronously via these ids.
 * Only fetch data for visible tracks (+ buffer).
 */

const ITEM_HEIGHT = 80; // px, adjust to your li height
const BUFFER_ROWS = 10; // number of extra items to fetch above/below viewport

export function FilterOutput() {
  const { filter } = useFilterContext();
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [trackData, setTrackData] = useState<Record<string, Track>>({});
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 20]);

  // Fetch track IDs when filter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTrackIds([]);
    setTrackData({});
    fetch("/api/spotify/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filter),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setTrackIds(data.trackIds || []);
      })
      .catch(err => {
        if (!cancelled) console.error("Error fetching track IDs:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  // Calculate visible range on scroll/resize
  useEffect(() => {
    function updateRange() {
      const el = listRef.current;
      if (!el) return;
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      const total = trackIds.length;
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ROWS);
      const end = Math.min(
        total,
        Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + BUFFER_ROWS
      );
      setVisibleRange([start, end]);
    }
    updateRange();
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateRange);
    window.addEventListener("resize", updateRange);
    return () => {
      el.removeEventListener("scroll", updateRange);
      window.removeEventListener("resize", updateRange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIds.length]);

  // Fetch track data for visible range
  useEffect(() => {
    const [start, end] = visibleRange;
    const idsToFetch = trackIds.slice(start, end).filter(id => !(id in trackData));
    if (idsToFetch.length === 0) return;
    let cancelled = false;
    fetch(`/api/spotify/get?trackIds=${idsToFetch.join(",")}`)
      .then(res => res.json())
      .then((data: { tracks: Track[] }) => {
        if (!cancelled && data.tracks) {
          setTrackData(prev => {
            const next = { ...prev };
            data.tracks.forEach((track: Track) => {
              next[track.id] = track;
            });
            return next;
          });
        }
      })
      .catch(err => {
        if (!cancelled) console.error("Error fetching track data:", err);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRange, trackIds]);

  // Render only visible items
  const [start, end] = visibleRange;
  const visibleIds = trackIds.slice(start, end);

  return (
    <ul
      ref={listRef}
      style={{
        height: "70vh",
        overflowY: "auto",
        position: "relative",
        padding: 0,
        margin: 0,
      }}
    >
      {loading ? (
        <li>Loading...</li>
      ) : trackIds.length === 0 ? (
        <li>No tracks found matching the filter criteria.</li>
      ) : (
        <div style={{ height: trackIds.length * ITEM_HEIGHT, position: "relative" }}>
          {visibleIds.map((id, i) => {
            const track = trackData[id];
            const top = (start + i) * ITEM_HEIGHT;
            return (
              <li
                key={id}
                style={{
                  position: "absolute",
                  top,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                  boxSizing: "border-box",
                  borderBottom: "1px solid #eee",
                  background: "#fff",
                  padding: "8px 12px",
                  listStyle: "none",
                }}
              >
                {track ? (
                  <div>
                    <h3>{track.name}</h3>
                    <p>Artist: {track.artists.map((artist: Artist) => artist.name).join(", ")}</p>
                    <p>Album: {track.album.name}</p>
                    <p>Duration: {Math.floor(track.duration / 1000)} seconds</p>
                  </div>
                ) : (
                  <span>Loading track...</span>
                )}
              </li>
            );
          })}
        </div>
      )}
    </ul>
  );
}