import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_ID_REGEX } from "@/lib/planner/plan";
import { ensureDriver, toStatus } from "@/lib/planner/tracer/run";

export const dynamic = "force-dynamic";

/**
 * How one of the minister's own traces is going. The planner asks every few
 * seconds while a trace runs; asking is also what restarts the follow-up of a
 * trace that was running when the server was restarted.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.role !== "minister") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const trace = PLAN_ID_REGEX.test(id) ? await prisma.planTrace.findFirst({ where: { id, ownerId: session.userId } }) : null;
  if (!trace) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trace.status === "running") ensureDriver(trace.id);
  return NextResponse.json(toStatus(trace), { headers: { "Cache-Control": "no-store" } });
}
