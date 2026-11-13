import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PlanResponse } from "@/lib/planner/plan";
import { stripFurniture } from "@/lib/planner/variants";
import { MAX_NAME_LENGTH, MAX_PLANS_PER_MINISTER, PLAN_ID_REGEX, sanitizePlan, uid } from "@/lib/planner/plan";

/*
 * Copy a flat plan into a new one owned by the caller. Any minister may copy
 * any plan. It is done here rather than in the browser so the plan image goes
 * from row to row without a trip down to the browser and up again.
 *
 * Furniture belongs to whoever placed it: a copy of your own plan keeps it, a
 * copy of someone else's comes without, and the caller unpacks "Mina möbler"
 * into it instead.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const SUFFIX = " (kopia)";

export async function POST(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (session?.role !== "minister") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const me = session.userId;
  const { id } = await params;

  // The one place besides the image route that loads the image bytes.
  const source = PLAN_ID_REGEX.test(id)
    ? await prisma.floorPlan.findUnique({ where: { id }, select: { name: true, ownerId: true, data: true, image: true, imageType: true } })
    : null;
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (await prisma.floorPlan.count({ where: { ownerId: me } }) >= MAX_PLANS_PER_MINISTER) {
    return NextResponse.json({ error: `At most ${MAX_PLANS_PER_MINISTER} plans per minister` }, { status: 400 });
  }

  const data = sanitizePlan(source.data);
  // All of it: the arrangements in the owner's other furnishing variants are their furniture too.
  if (source.ownerId !== me) stripFurniture(data);
  // The picture's URL is cached for a year by plan id and rev, so the copy gets a rev of its own.
  if (data.image) data.image.rev = Date.now();
  // The suffix is what tells the two apart in the plan picker, so a long name gives way to it.
  const name = source.name.slice(0, MAX_NAME_LENGTH - SUFFIX.length).trimEnd() + SUFFIX;

  const saved = await prisma.floorPlan.create({
    // Same id format as the browser makes for a new plan.
    data: { id: uid(), ownerId: me, name, data, editedAt: new Date(), image: source.image, imageType: source.imageType },
    select: { id: true, name: true, ownerId: true, editedAt: true },
  });
  const body: PlanResponse = { id: saved.id, ownerId: saved.ownerId, name: saved.name, data, editedAt: saved.editedAt.getTime() };
  return NextResponse.json(body, { status: 201, headers: { "Cache-Control": "no-store" } });
}
