import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Item } from "@/lib/planner/plan";
import { MAX_PLAN_JSON_BYTES, sanitizeFurniture } from "@/lib/planner/plan";

/*
 * "Mina möbler": the caller's own furniture, which the planner unpacks into
 * their plans. Private to each minister; there is nothing here to browse.
 */

export const dynamic = "force-dynamic";

/** GET and PUT both answer with the stored set. */
export type FurnitureResponse = { items: Item[] };
const noStore = { "Cache-Control": "no-store" };

async function ministerId(): Promise<string | null> {
  const session = await auth();
  return session?.role === "minister" ? session.userId : null;
}

export async function GET() {
  const me = await ministerId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const row = await prisma.furnitureSet.findUnique({ where: { ownerId: me } });
  return NextResponse.json({ items: sanitizeFurniture(row?.items) } satisfies FurnitureResponse, { headers: noStore });
}

/** Replace the whole set. Body: `{ items }`. */
export async function PUT(req: NextRequest) {
  const me = await ministerId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const text = await req.text();
  if (text.length > MAX_PLAN_JSON_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  }
  catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const items = sanitizeFurniture(typeof body === "object" && body !== null ? (body as { items?: unknown }).items : null);
  await prisma.furnitureSet.upsert({ where: { ownerId: me }, create: { ownerId: me, items }, update: { items } });
  return NextResponse.json({ items } satisfies FurnitureResponse, { headers: noStore });
}
