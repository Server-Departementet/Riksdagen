import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CommentsResponse } from "@/lib/planner/comments";
import { MAX_COMMENTS_PER_MINUTE, cleanCommentBody } from "@/lib/planner/comments";
import { commentSession, loadComments, planOwner, readBody, sweepOrphans } from "@/lib/planner/comments-server";
import { PLAN_ID_REGEX } from "@/lib/planner/plan";

/*
 * The comments and reactions on one flat plan. Every minister may read and
 * comment on every plan. Who is commenting comes from the session only.
 *
 * All routes below this path answer with the plan's whole CommentsResponse.
 * A plan that is not on the server reads as empty and cannot be commented.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await commentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
  return NextResponse.json(await loadComments(id, session.userId) satisfies CommentsResponse, { headers: noStore });
}

/** Post a comment. Body: `{ body }`. */
export async function POST(req: NextRequest, { params }: Context) {
  const session = await commentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });

  const body = cleanCommentBody((await readBody(req))?.body);
  if (body === null) return NextResponse.json({ error: "Expected { body } of 1 to 500 characters" }, { status: 400 });
  if (await planOwner(id) === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Counted from the table itself. Two posts racing past the check only stretch the limit by one.
  const recent = await prisma.planComment.count({ where: { authorId: session.userId, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= MAX_COMMENTS_PER_MINUTE) return NextResponse.json({ error: "Too many comments, wait a minute" }, { status: 429 });

  await prisma.planComment.create({ data: { planId: id, authorId: session.userId, body } });
  await sweepOrphans();
  return NextResponse.json(await loadComments(id, session.userId) satisfies CommentsResponse, { status: 201, headers: noStore });
}
