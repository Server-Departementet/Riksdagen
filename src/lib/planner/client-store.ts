import type { PlanDoc, PlanMeta, PlanResponse } from "@/lib/planner/plan";
import { cleanName, sanitizePlan } from "@/lib/planner/plan";

/*
 * Where the planner keeps plans: this browser's localStorage and the server.
 * Only the minister's own plans are kept locally. `dirty` marks a local copy
 * with edits the server hasn't confirmed yet.
 */

export type LocalPlan = PlanDoc & { ownerId: string; dirty: boolean };

const PREFIX = "riks.planlosning.";

function parseLocal(raw: string | null): LocalPlan | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof LocalPlan, unknown>> | null;
    if (!v || typeof v.ownerId !== "string" || typeof v.editedAt !== "number") return null;
    return { name: cleanName(v.name), data: sanitizePlan(v.data), editedAt: v.editedAt, ownerId: v.ownerId, dirty: v.dirty === true };
  }
  catch {
    return null;
  }
}

export function readLocal(id: string): LocalPlan | null {
  try { return parseLocal(localStorage.getItem(PREFIX + id)); }
  catch { return null; /* private mode */ }
}

export function writeLocal(id: string, plan: LocalPlan): void {
  try { localStorage.setItem(PREFIX + id, JSON.stringify(plan)); }
  catch { /* private mode or full: the server copy still has it */ }
}

export function removeLocal(id: string): void {
  try { localStorage.removeItem(PREFIX + id); }
  catch { /* private mode */ }
}

export function listLocal(): { id: string; plan: LocalPlan }[] {
  const out: { id: string; plan: LocalPlan }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const plan = parseLocal(localStorage.getItem(key));
      if (plan) out.push({ id: key.slice(PREFIX.length), plan });
    }
  }
  catch { /* private mode */ }
  return out;
}

const api = (id: string) => `/api/planlosning/${encodeURIComponent(id)}`;

function toResponse(v: unknown): PlanResponse {
  const r = v as Partial<Record<keyof PlanResponse, unknown>>;
  return {
    id: String(r.id), ownerId: String(r.ownerId), name: cleanName(r.name), data: sanitizePlan(r.data),
    editedAt: typeof r.editedAt === "number" ? r.editedAt : 0,
  };
}

/** Null when the plan doesn't exist (any more). Throws when the server can't be reached. */
export async function fetchPlan(id: string): Promise<PlanResponse | null> {
  const res = await fetch(api(id), { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return toResponse(await res.json());
}

export async function fetchPlans(): Promise<PlanMeta[]> {
  const res = await fetch("/api/planlosning", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as { plans: PlanMeta[] }).plans;
}

/**
 * "conflict" means the server already had a newer edit; `plan` is then that newer plan.
 * Throws when the server can't be reached or refuses the save.
 */
export async function savePlan(id: string, doc: PlanDoc): Promise<{ status: "saved" | "conflict"; plan: PlanResponse }> {
  const body = JSON.stringify(doc);
  // keepalive lets a save outlive the page being closed, but browsers cap such bodies at 64 KiB.
  const res = await fetch(api(id), { method: "PUT", headers: { "content-type": "application/json" }, body, keepalive: body.length < 30_000 });
  if (res.status !== 409 && !res.ok) throw new Error(`HTTP ${res.status}`);
  return { status: res.status === 409 ? "conflict" : "saved", plan: toResponse(await res.json()) };
}

export async function deletePlan(id: string): Promise<void> {
  const res = await fetch(api(id), { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Copy a plan on the server into a new one of the caller's own. "missing": the plan is gone;
 * "full": the caller already has as many plans as allowed. Throws when the server can't be reached.
 */
export async function copyPlan(id: string): Promise<{ status: "copied"; plan: PlanResponse } | { status: "missing" } | { status: "full" }> {
  const res = await fetch(`${api(id)}/copy`, { method: "POST" });
  if (res.status === 404) return { status: "missing" };
  if (res.status === 400) return { status: "full" };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { status: "copied", plan: toResponse(await res.json()) };
}

export async function uploadImage(id: string, image: Blob): Promise<void> {
  const res = await fetch(`${api(id)}/image`, { method: "PUT", headers: { "content-type": image.type || "application/octet-stream" }, body: image });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export const imageUrl = (id: string, rev: number) => `${api(id)}/image?rev=${rev}`;
