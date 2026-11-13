"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PlanMeta } from "@/lib/planner/plan";
import type { PresenceResponse, PresenceViewer } from "@/lib/planner/presence";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/planner/presence";

const PRESENCE_URL = "/api/planlosning/presence";
// One id per page load, so the server can tell this minister's tabs apart. Only ever sent from effects, never rendered.
const TAB_ID = Math.random().toString(36).slice(2, 12).padEnd(4, "0");

/**
 * The other ministers who have the planner open right now, each with the plan
 * they are on. Sends a heartbeat while the tab is visible and leaves when the
 * planner is closed. Presence is decoration: every failure (offline, logged out)
 * just shows nobody.
 */
function usePresence(planId: string | null, myId: string): PresenceViewer[] {
  const [viewers, setViewers] = useState<PresenceViewer[]>([]);

  // Re-run for every plan switch, which also tells the others about the new plan at once.
  useEffect(() => {
    let stopped = false;

    const beat = async () => {
      // A hidden tab is not "looking". It stops beating and simply times out on the server,
      // so a quick glance at another tab doesn't make the avatar flicker for everyone else.
      if (document.hidden) return;
      let next: PresenceViewer[] = [];
      try {
        const res = await fetch(PRESENCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab: TAB_ID, planId }),
          cache: "no-store",
        });
        if (res.ok) next = (await res.json() as PresenceResponse).viewers;
      }
      catch {
        // Offline: nobody to show.
      }
      if (!stopped) setViewers(next);
    };
    const onVisibility = () => { if (!document.hidden) void beat(); };
    // A page restored from the back/forward cache has left but keeps its timer; don't wait for the next tick.
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) void beat(); };

    void beat();
    const timer = setInterval(() => void beat(), PRESENCE_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [planId]);

  // Leaving is tied to the planner going away, not to a plan switch: between plans the minister is still here.
  useEffect(() => {
    const leave = () => {
      // keepalive lets the request outlive the page when the tab is being closed.
      void fetch(`${PRESENCE_URL}?tab=${TAB_ID}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
    };
    window.addEventListener("pagehide", leave);
    return () => { window.removeEventListener("pagehide", leave); leave(); };
  }, []);

  // The server already leaves the caller out; filtering again keeps that true whatever it answers.
  return viewers.filter((v) => v.id !== myId);
}

function Face({ viewer, here }: { viewer: PresenceViewer; here: boolean }) {
  // Discord avatar URLs die when someone changes picture, and the session keeps the old one for up to a month.
  const [broken, setBroken] = useState(false);
  // Same plan as you: full colour inside a coloured ring. Elsewhere: greyed out.
  const look = `size-8 rounded-full ring-2 ${here ? "ring-orange-400" : "ring-gray-300 opacity-60 grayscale"}`;
  return viewer.avatar && !broken
    ? <Image width={32} height={32} src={viewer.avatar} className={`${look} bg-gray-200`} alt="" onError={() => setBroken(true)} />
    : (
      <span aria-hidden className={`${look} bg-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center select-none`}>
        {(viewer.name.trim()[0] ?? "?").toUpperCase()}
      </span>
    );
}

/**
 * A row of avatars of the other ministers who have the planner open. Those on
 * the same plan as you stand out; the rest are dimmed and take you to their plan
 * when clicked. Renders nothing when nobody else is around.
 */
export function PlanPresence(
  { me, planId, metas, onOpen }: { me: { id: string }; planId: string | null; metas: PlanMeta[]; onOpen: (id: string) => void },
) {
  const viewers = usePresence(planId, me.id);
  if (viewers.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 px-0.5" aria-label="Andra som är här just nu">
      {viewers.map((v) => {
        const here = v.planId !== null && v.planId === planId;
        // A plan that isn't in our list yet (just created, or not yet synced by its owner) can't be opened from here.
        const meta = metas.find((m) => m.id === v.planId);
        const where = here
          ? "samma planlösning som du"
          : meta
            ? `”${meta.name}”${meta.ownerId === v.id ? "" : ` (${meta.ownerId === me.id ? "din" : `${meta.ownerName}s`})`}`
            : v.planId ? "en planlösning som inte finns i din lista än" : null;
        const label = where ? `${v.name} tittar på ${where}` : `${v.name} har ingen planlösning öppen`;
        return (
          <li key={v.id} className="flex">
            {!here && meta
              ? (
                <button
                  type="button" className="rounded-full cursor-pointer hover:*:opacity-100 hover:*:grayscale-0"
                  title={`${label}. Klicka för att öppna den.`} aria-label={`${label}. Öppna den.`}
                  onClick={() => onOpen(meta.id)}
                >
                  <Face viewer={v} here={false} />
                </button>
              )
              : <span role="img" className="rounded-full" title={label} aria-label={label}><Face viewer={v} here={here} /></span>}
          </li>
        );
      })}
    </ul>
  );
}
