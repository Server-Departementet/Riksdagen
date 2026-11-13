import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listPlans } from "@/lib/planner/server";

export const dynamic = "force-dynamic";

/** Every minister's plans (without their contents), for the planner's plan picker. */
export async function GET() {
  const session = await auth();
  if (session?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.json({ plans: await listPlans(session.userId) }, { headers: { "Cache-Control": "no-store" } });
}
