import "server-only";
import { prisma } from "@/lib/prisma";
import type { PlanMeta } from "@/lib/planner/plan";
import { listingMeta } from "@/lib/planner/listing";

/** Every minister's plans, most recently edited first. Loads each plan's JSON for the facts the list shows, never the images. */
export async function listPlans(): Promise<PlanMeta[]> {
  const rows = await prisma.floorPlan.findMany({
    select: { id: true, name: true, ownerId: true, editedAt: true, data: true, owner: { select: { name: true } } },
    orderBy: { editedAt: "desc" },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, ownerId: r.ownerId, ownerName: r.owner.name ?? "Okänd minister", editedAt: r.editedAt.getTime(), ...listingMeta(r.data) }));
}
