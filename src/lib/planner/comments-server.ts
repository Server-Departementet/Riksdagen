import "server-only";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/session";
import type { CommentsResponse } from "@/lib/planner/comments";
import { MAX_COMMENTS_RETURNED, REACTIONS, isReactionKey } from "@/lib/planner/comments";

/*
 * Server side of the comments and reactions on flat plans, shared by the routes
 * under /api/planlosning/[id]/comments.
 *
 * Comments and reactions carry a plan id but no foreign key. A plan that does
 * not exist on the server (not synced yet, or deleted) simply has no comments:
 * nothing can be posted to it and whatever rows it left behind are never shown.
 * Those leftovers are removed by sweepOrphans(), so deleting a plan needs to
 * know nothing about comments.
 */

/**
 * Avatar URLs live only in the session cookie, not in the database, so the ones
 * that pass by are remembered here: a comment then shows its author's picture
 * once that minister has used the comments since the server started, and a
 * coloured initial before that. Memory only, as with presence; on globalThis so
 * a dev-server reload keeps one copy.
 */
const avatars = ((globalThis as { planCommentAvatars?: Map<string, string> }).planCommentAvatars ??= new Map<string, string>());

/** The caller's session if they are a minister. Everything here is for ministers only. */
export async function commentSession(): Promise<Session | null> {
  const session = await auth();
  if (session?.role !== "minister") return null;
  if (session.avatar) avatars.set(session.userId, session.avatar);
  return session;
}

/** A small JSON object body, or null when it is not one. */
export async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    // Far more than any valid body here; keeps a huge upload from being parsed.
    if (text.length > 10_000) return null;
    const body: unknown = JSON.parse(text);
    return typeof body === "object" && body !== null ? body as Record<string, unknown> : null;
  }
  catch {
    return null;
  }
}

/** The plan's owner, or null when the plan is not on the server. */
export async function planOwner(planId: string): Promise<string | null> {
  return (await prisma.floorPlan.findUnique({ where: { id: planId }, select: { ownerId: true } }))?.ownerId ?? null;
}

/** Everything the comments card shows for one plan, as seen by `viewerId`. */
export async function loadComments(planId: string, viewerId: string): Promise<CommentsResponse> {
  const ownerId = await planOwner(planId);
  // Without the plan there is nothing to show, even if rows of a deleted plan are still around.
  const [rows, reacted] = ownerId === null
    ? [[], []]
    : await Promise.all([
      prisma.planComment.findMany({
        where: { planId },
        orderBy: { id: "desc" }, // newest first, so the cap drops the oldest
        take: MAX_COMMENTS_RETURNED,
        select: { id: true, authorId: true, body: true, createdAt: true, author: { select: { name: true, avatarColor: true } } },
      }),
      // At most one row per minister, so counting here is cheaper than a groupBy plus a second query for the names.
      prisma.planReaction.findMany({ where: { planId }, select: { userId: true, emoji: true, user: { select: { name: true } } } }),
    ]);

  return {
    comments: rows.reverse().map((r) => ({
      id: r.id,
      authorId: r.authorId,
      authorName: r.author.name ?? "Okänd minister",
      authorColor: r.author.avatarColor,
      authorAvatar: avatars.get(r.authorId) ?? null,
      body: r.body,
      createdAt: r.createdAt.getTime(),
      canDelete: r.authorId === viewerId || ownerId === viewerId,
    })),
    reactions: REACTIONS.map(([key]) => {
      const who = reacted.filter((r) => r.emoji === key);
      return { key, count: who.length, names: who.map((r) => r.user.name ?? "Okänd minister") };
    }),
    mine: reacted.map((r) => (r.userId === viewerId ? r.emoji : null)).find(isReactionKey) ?? null,
    now: Date.now(),
  };
}

/**
 * Remove the comments and reactions of plans that no longer exist. Run when
 * someone posts a comment: often enough for a handful of friends, and never in
 * the way of reading. A plan must be on the server before it can be commented,
 * so a row without its plan is always a leftover. One statement each, so a plan
 * created meanwhile cannot lose anything. Failing is harmless: the rows are
 * ignored anyway.
 */
export async function sweepOrphans(): Promise<void> {
  try {
    await prisma.$executeRaw`DELETE FROM \`PlanComment\` WHERE \`planId\` NOT IN (SELECT \`id\` FROM \`FloorPlan\`)`;
    await prisma.$executeRaw`DELETE FROM \`PlanReaction\` WHERE \`planId\` NOT IN (SELECT \`id\` FROM \`FloorPlan\`)`;
  }
  catch (error) {
    console.error("planlosning comments: sweeping orphans failed", error);
  }
}
