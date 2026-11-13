/*
 * Which ministers have the planner open right now, and which plan each is on.
 *
 * Kept in memory only: the site runs as one long-lived Node process, and presence
 * is worth nothing a minute later, so a restart losing it costs nothing. Browsers
 * send a heartbeat while the planner is on screen; whoever stops is dropped after
 * PRESENCE_TTL_MS.
 *
 * A minister is tracked per tab, so closing one of two tabs doesn't make them
 * vanish for everyone else until the other tab's next heartbeat.
 */

/** How often a visible tab says it is still there. */
export const PRESENCE_HEARTBEAT_MS = 15_000;
/** Two missed heartbeats and a little slack for a slow network. */
export const PRESENCE_TTL_MS = 35_000;
export const PRESENCE_TAB_REGEX = /^[a-z0-9]{4,16}$/;
// Tab ids come from the browser, so one minister must not be able to grow the map without bound.
const MAX_TABS_PER_VIEWER = 8;

/** An active minister. `planId` is null while they have the planner open without a plan. */
export type PresenceViewer = { id: string; name: string; avatar: string; planId: string | null };
export type PresenceResponse = { viewers: PresenceViewer[] };

/** `since` is when the tab arrived at its current plan; `lastSeen` is its latest heartbeat. */
type Tab = { planId: string | null; since: number; lastSeen: number };
type Entry = { name: string; avatar: string; tabs: Map<string, Tab> };
type Store = Map<string, Entry>;

// On globalThis so a dev-server reload doesn't leave route handlers talking to different copies.
const store = ((globalThis as { planPresence?: Store }).planPresence ??= new Map<string, Entry>());

/** Drop everything that has gone quiet. Run on every call instead of on a timer: with a handful of ministers the whole map is tiny. */
function prune(now: number): void {
  for (const [viewerId, entry] of store) {
    for (const [tabId, tab] of entry.tabs) {
      if (now - tab.lastSeen > PRESENCE_TTL_MS) entry.tabs.delete(tabId);
    }
    if (entry.tabs.size === 0) store.delete(viewerId);
  }
}

/**
 * With several tabs open, a minister is shown on the plan they moved to last.
 * Going by the latest heartbeat instead would make them flip between plans every few seconds.
 */
function currentPlan(entry: Entry): string | null {
  let latest: Tab | null = null;
  for (const tab of entry.tabs.values()) if (!latest || tab.since > latest.since) latest = tab;
  return latest?.planId ?? null;
}

/** Record a heartbeat and return every other active minister, longest-standing first (Map order), so avatars don't jump around between heartbeats. */
export function touchPresence(
  viewer: { id: string; name: string; avatar: string },
  tabId: string,
  planId: string | null,
  now = Date.now(),
): PresenceViewer[] {
  prune(now);
  let entry = store.get(viewer.id);
  if (!entry) store.set(viewer.id, entry = { name: viewer.name, avatar: viewer.avatar, tabs: new Map() });
  // The session may have been renewed with a new name or avatar since the first heartbeat.
  entry.name = viewer.name;
  entry.avatar = viewer.avatar;

  const tab = entry.tabs.get(tabId);
  if (tab) {
    if (tab.planId !== planId) tab.since = now;
    tab.planId = planId;
    tab.lastSeen = now;
  }
  else {
    if (entry.tabs.size >= MAX_TABS_PER_VIEWER) {
      const stalest = [...entry.tabs].reduce((a, b) => (b[1].lastSeen < a[1].lastSeen ? b : a));
      entry.tabs.delete(stalest[0]);
    }
    entry.tabs.set(tabId, { planId, since: now, lastSeen: now });
  }

  return [...store]
    .filter(([id]) => id !== viewer.id)
    .map(([id, other]) => ({ id, name: other.name, avatar: other.avatar, planId: currentPlan(other) }));
}

/** One tab closed the planner. */
export function leavePresence(viewerId: string, tabId: string, now = Date.now()): void {
  store.get(viewerId)?.tabs.delete(tabId);
  prune(now);
}
