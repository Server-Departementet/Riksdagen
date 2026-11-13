import "server-only";
import { prisma } from "@/lib/prisma";
import type { PlanMeta } from "@/lib/planner/plan";
import { sanitizeFurniture, sanitizePlan } from "@/lib/planner/plan";
import { fitOf } from "@/lib/planner/fit";
import { listingMeta } from "@/lib/planner/listing";

/**
 * Every minister's plans, most recently edited first, each with how its furnishing stands; `me`'s own plans
 * are also held against their "Mina möbler", and with the rent and deadline of its listing. Never loads the images. It does load and check every plan's
 * drawing for the furnishing status, on each call: fine for the few dozen plans there can be (each at most
 * MAX_PLAN_JSON_BYTES), and the first thing to cache or store with the plan should there be many more.
 */
export async function listPlans(me: string): Promise<PlanMeta[]> {
  const [rows, set] = await Promise.all([
    prisma.floorPlan.findMany({
      select: { id: true, name: true, ownerId: true, editedAt: true, data: true, owner: { select: { name: true } } },
      orderBy: { editedAt: "desc" },
    }),
    prisma.furnitureSet.findUnique({ where: { ownerId: me }, select: { items: true } }),
  ]);
  const furniture = sanitizeFurniture(set?.items);
  return rows.map((r) => ({
    id: r.id, name: r.name, ownerId: r.ownerId, ownerName: r.owner.name ?? "Okänd minister", editedAt: r.editedAt.getTime(),
    fit: fitOf(sanitizePlan(r.data), r.ownerId === me ? furniture : undefined),
    ...listingMeta(r.data),
  }));
}
