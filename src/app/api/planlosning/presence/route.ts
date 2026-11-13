import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLAN_ID_REGEX } from "@/lib/planner/plan";
import type { PresenceResponse } from "@/lib/planner/presence";
import { PRESENCE_TAB_REGEX, leavePresence, touchPresence } from "@/lib/planner/presence";

/*
 * Which ministers have the planner open, and on which plan. The planner sends a
 * heartbeat (POST) while it is on screen and says goodbye (DELETE) when the page
 * is closed.
 *
 * Who the caller is comes from the session only. The browser supplies `tab`, an
 * opaque id that tells the caller's own tabs apart, and the id of the plan it shows.
 *
 * The plan row is deliberately not looked up: a plan created offline may not have
 * reached the server yet, and every minister may open every plan anyway.
 */

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.role !== "minister") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  }
  catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const input = typeof body === "object" && body !== null ? body as { tab?: unknown; planId?: unknown } : {};
  const planId = input.planId ?? null;
  if (typeof input.tab !== "string" || !PRESENCE_TAB_REGEX.test(input.tab)
    || (planId !== null && (typeof planId !== "string" || !PLAN_ID_REGEX.test(planId)))) {
    return NextResponse.json({ error: "Expected { tab, planId }" }, { status: 400 });
  }

  const viewers = touchPresence({ id: session.userId, name: session.name, avatar: session.avatar }, input.tab, planId);
  return NextResponse.json({ viewers } satisfies PresenceResponse, { headers: noStore });
}

/** `tab` is in the query string because a request sent while the page closes is simplest without a body. */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.role !== "minister") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const tab = req.nextUrl.searchParams.get("tab") ?? "";
  if (!PRESENCE_TAB_REGEX.test(tab)) return NextResponse.json({ error: "Invalid tab id" }, { status: 400 });
  leavePresence(session.userId, tab);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
