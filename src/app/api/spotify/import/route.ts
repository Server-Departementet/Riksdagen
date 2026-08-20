import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prisma";

/**
 * Historic takeout import, enqueue side. Receives chunks of plays parsed
 * client-side from "Streaming_History_Audio_*.json" and writes them to the
 * import queue — no Spotify calls happen here, so uploads are instant.
 * scripts/process-import-queue.ts drains the queue from cron at a slow pace.
 *
 * Re-uploading the same file is a no-op: plays already in the database are
 * counted as alreadyImported, plays already queued as alreadyQueued (the
 * queue's (userId, trackId, playedAt) unique key absorbs them).
 */

const MAX_PLAYS_PER_REQUEST = 1000;
const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/;

type ImportPlay = {
  trackId: string;
  playedAt: string; // ISO timestamp
};

export type ImportResponse = {
  received: number;
  queued: number;
  /** Plays this user already has in the queue */
  alreadyQueued: number;
  /** Plays this user already has in the database (same track and second) */
  alreadyImported: number;
};

export type QueueStatus = {
  pending: number;
  done: number;
  duplicate: number;
  failed: number;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  }
  catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plays = parsePlays(body);
  if (!plays) {
    return NextResponse.json(
      { error: `Expected { plays: { trackId, playedAt }[] } with at most ${MAX_PLAYS_PER_REQUEST} items` },
      { status: 400 },
    );
  }

  // Exact-match plays that are already in the database (imported plays keep
  // their takeout timestamps verbatim, so a re-upload collides exactly)
  const storedPlays = await prisma.trackPlay.findMany({
    where: {
      userId: session.userId,
      trackId: { in: [...new Set(plays.map((play) => play.trackId))] },
      playedAt: { in: plays.map((play) => new Date(play.playedAt)) },
    },
    select: { trackId: true, playedAt: true },
  });
  const storedKeys = new Set(storedPlays.map((play) => `${play.trackId}@${play.playedAt.getTime()}`));

  const toQueue = plays.filter((play) => !storedKeys.has(`${play.trackId}@${new Date(play.playedAt).getTime()}`));
  const alreadyImported = plays.length - toQueue.length;

  const { count: queued } = await prisma.importQueueItem.createMany({
    skipDuplicates: true,
    data: toQueue.map((play) => ({
      userId: session.userId,
      trackId: play.trackId,
      playedAt: new Date(play.playedAt),
    })),
  });

  return NextResponse.json({
    received: plays.length,
    queued,
    alreadyQueued: toQueue.length - queued,
    alreadyImported,
  } satisfies ImportResponse);
}

/** Queue status for the logged-in user, shown in the import panel. */
export async function GET() {
  const session = await auth();
  if (session?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const groups = await prisma.importQueueItem.groupBy({
    by: ["status"],
    where: { userId: session.userId },
    _count: { _all: true },
  });

  const status: QueueStatus = { pending: 0, done: 0, duplicate: 0, failed: 0 };
  for (const group of groups) {
    if (group.status in status) {
      status[group.status as keyof QueueStatus] = group._count._all;
    }
  }

  return NextResponse.json(status satisfies QueueStatus);
}

function parsePlays(body: unknown): ImportPlay[] | null {
  if (typeof body !== "object" || body === null) return null;
  const plays = (body as { plays?: unknown }).plays;
  if (!Array.isArray(plays) || plays.length === 0 || plays.length > MAX_PLAYS_PER_REQUEST) return null;

  const parsed: ImportPlay[] = [];
  for (const play of plays as unknown[]) {
    if (typeof play !== "object" || play === null) return null;
    const { trackId, playedAt } = play as { trackId?: unknown; playedAt?: unknown };
    if (typeof trackId !== "string" || !SPOTIFY_ID_REGEX.test(trackId)) return null;
    if (typeof playedAt !== "string" || isNaN(new Date(playedAt).getTime())) return null;
    parsed.push({ trackId, playedAt });
  }
  return parsed;
}
