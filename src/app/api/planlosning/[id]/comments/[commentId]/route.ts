import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CommentsResponse } from "@/lib/planner/comments";
import { COMMENT_ID_REGEX } from "@/lib/planner/comments";
import { commentSession, loadComments, planOwner } from "@/lib/planner/comments-server";
import { PLAN_ID_REGEX } from "@/lib/planner/plan";

/*
 * Delete one comment. Allowed for its author, and for the owner of the plan it
 * is on, who gets to keep their own plan tidy. Answers with what is left.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await commentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id, commentId } = await params;
  if (!PLAN_ID_REGEX.test(id) || !COMMENT_ID_REGEX.test(commentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Looked up together with the plan id, so the plan in the URL is the one whose owner is checked.
  const comment = await prisma.planComment.findFirst({ where: { id: Number(commentId), planId: id }, select: { id: true, authorId: true } });
  // Already gone (deleted from another tab, say) is what the caller wanted: just answer with the current list.
  if (comment) {
    if (comment.authorId !== session.userId && await planOwner(id) !== session.userId) {
      return NextResponse.json({ error: "Not your comment" }, { status: 403 });
    }
    await prisma.planComment.deleteMany({ where: { id: comment.id } });
  }
  return NextResponse.json(await loadComments(id, session.userId) satisfies CommentsResponse, { headers: { "Cache-Control": "no-store" } });
}
