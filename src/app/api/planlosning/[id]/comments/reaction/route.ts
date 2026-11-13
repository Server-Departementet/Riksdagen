import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CommentsResponse } from "@/lib/planner/comments";
import { isReactionKey } from "@/lib/planner/comments";
import { commentSession, loadComments, planOwner, readBody } from "@/lib/planner/comments-server";
import { PLAN_ID_REGEX } from "@/lib/planner/plan";

/*
 * The caller's emoji reaction to a plan: one per minister and plan.
 *
 * The browser does the toggling and sends the outcome (`{ emoji: key }` to set
 * or replace, `{ emoji: null }` to remove), so a request that is sent twice
 * cannot flip the reaction back.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Context) {
  const session = await commentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });

  const body = await readBody(req);
  const emoji = body && "emoji" in body ? body.emoji : undefined;
  if (emoji !== null && !isReactionKey(emoji)) return NextResponse.json({ error: "Expected { emoji } with a known reaction or null" }, { status: 400 });

  const key = { planId_userId: { planId: id, userId: session.userId } };
  if (emoji === null) {
    await prisma.planReaction.deleteMany({ where: { planId: id, userId: session.userId } });
  }
  else {
    if (await planOwner(id) === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.planReaction.upsert({ where: key, create: { planId: id, userId: session.userId, emoji }, update: { emoji } });
  }
  return NextResponse.json(await loadComments(id, session.userId) satisfies CommentsResponse, { headers: { "Cache-Control": "no-store" } });
}
