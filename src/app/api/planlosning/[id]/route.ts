import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PlanResponse } from "@/lib/planner/plan";
import { cleanName, MAX_PLAN_JSON_BYTES, MAX_PLANS_PER_MINISTER, PLAN_ID_REGEX, sanitizePlan } from "@/lib/planner/plan";

/*
 * One flat plan. Every minister may read any plan; only its owner may save or
 * delete it.
 *
 * Saving is "newest edit wins": the body carries `editedAt`, the moment of the
 * last edit on the editing browser's clock. A save older than what is stored is
 * answered with 409 and the stored plan, which the browser then adopts. That way
 * a phone that was offline for a day can't overwrite what the laptop did since.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };
const fields = { id: true, name: true, ownerId: true, data: true, editedAt: true } as const;

type Row = { id: string; name: string; ownerId: string; data: unknown; editedAt: Date };
const toResponse = (row: Row): PlanResponse =>
  ({ id: row.id, ownerId: row.ownerId, name: row.name, data: sanitizePlan(row.data), editedAt: row.editedAt.getTime() });

async function ministerId(): Promise<string | null> {
  const session = await auth();
  return session?.role === "minister" ? session.userId : null;
}

export async function GET(_req: NextRequest, { params }: Context) {
  if (!await ministerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const row = PLAN_ID_REGEX.test(id) ? await prisma.floorPlan.findUnique({ where: { id }, select: fields }) : null;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toResponse(row), { headers: noStore });
}

export async function PUT(req: NextRequest, { params }: Context) {
  const me = await ministerId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });

  const text = await req.text();
  if (text.length > MAX_PLAN_JSON_BYTES) return NextResponse.json({ error: "Plan too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  }
  catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const input = typeof body === "object" && body !== null ? body as { name?: unknown; data?: unknown; editedAt?: unknown } : {};
  if (typeof input.editedAt !== "number" || !Number.isFinite(input.editedAt) || input.editedAt <= 0) {
    return NextResponse.json({ error: "Expected { name, data, editedAt }" }, { status: 400 });
  }
  // A browser whose clock runs ahead must not lock the plan against every later edit.
  const editedAt = new Date(Math.min(input.editedAt, Date.now()));
  const name = cleanName(input.name);
  const data = sanitizePlan(input.data);

  const existing = await prisma.floorPlan.findUnique({ where: { id }, select: fields });
  if (existing && existing.ownerId !== me) return NextResponse.json({ error: "Not your plan" }, { status: 403 });
  if (existing && existing.editedAt.getTime() >= editedAt.getTime()) {
    return NextResponse.json(toResponse(existing), { status: 409, headers: noStore });
  }
  if (!existing && await prisma.floorPlan.count({ where: { ownerId: me } }) >= MAX_PLANS_PER_MINISTER) {
    return NextResponse.json({ error: `At most ${MAX_PLANS_PER_MINISTER} plans per minister` }, { status: 400 });
  }

  const saved = existing
    ? await prisma.floorPlan.update({ where: { id }, data: { name, data, editedAt }, select: fields })
    : await prisma.floorPlan.create({ data: { id, ownerId: me, name, data, editedAt }, select: fields });
  return NextResponse.json(toResponse(saved), { headers: noStore });
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const me = await ministerId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
  // Scoped to the owner, so someone else's plan is simply not found.
  await prisma.floorPlan.deleteMany({ where: { id, ownerId: me } });
  return NextResponse.json({ ok: true });
}
