import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_IMAGE_BYTES, MAX_PLANS_PER_MINISTER, sniffImageType } from "@/lib/planner/plan";
import type { TraceOverview } from "@/lib/planner/tracer/config";
import { LISTING_HOSTS, listingUrl, tracerConfigured, tracerLimits } from "@/lib/planner/tracer/config";
import { ensureDriver, refusal, start, toStatus, usedToday } from "@/lib/planner/tracer/run";

/*
 * "Trace this floor plan for me": hands a plan picture and/or a listing link to
 * the Claude agent described in src/lib/planner/tracer/run.ts.
 *
 * Every trace costs real money, so this is where the limits sit: one running
 * trace per minister, a daily count per minister and for everyone together, and
 * a cap on how many run at once (all in tracerLimits, set from .env). On top of
 * that each session carries its own dollar ceiling, enforced by the platform.
 */

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const say = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

async function ministerId(): Promise<string | null> {
  const session = await auth();
  return session?.role === "minister" ? session.userId : null;
}

/** What the dialog needs: whether tracing is set up, how much of today's quota is left, and a trace still running. */
export async function GET() {
  const me = await ministerId();
  if (!me) return say("Unauthorized", 403);
  const running = await prisma.planTrace.findFirst({ where: { ownerId: me, status: "running" }, orderBy: { createdAt: "desc" } });
  if (running) ensureDriver(running.id);
  const overview: TraceOverview = {
    configured: tracerConfigured(), hosts: LISTING_HOSTS, perDay: tracerLimits().perMinisterPerDay,
    usedToday: await usedToday(me), active: running ? toStatus(running) : null,
  };
  return NextResponse.json(overview, { headers: noStore });
}

/** Start a trace. Form fields: `image` (the cropped plan picture, optional), `url` (a listing link, optional), `note`. */
export async function POST(req: NextRequest) {
  const me = await ministerId();
  if (!me) return say("Unauthorized", 403);
  if (!tracerConfigured()) return say("AI-ritning är inte uppsatt på den här servern.", 503);

  let form: FormData;
  try {
    form = await req.formData();
  }
  catch {
    return say("Felaktig förfrågan.", 400);
  }
  const field = (name: string) => { const v = form.get(name); return typeof v === "string" ? v.trim() : ""; };
  const file = form.get("image"), link = field("url"), note = field("note").slice(0, 500);

  let image: Parameters<typeof start>[0]["image"] = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return say("Bilden är för stor.", 413);
    const bytes = new Uint8Array(await file.arrayBuffer()), type = sniffImageType(bytes);
    if (!type) return say("Bilden måste vara PNG, JPEG eller WebP.", 400);
    image = { bytes, type };
  }
  const url = link ? listingUrl(link) : null;
  if (link && !url) return say(`Länken måste gå till någon av: ${LISTING_HOSTS.join(", ")}.`, 400);
  if (!image && !url) return say("Ladda upp en planritning eller ange en länk till annonsen.", 400);

  const blocked = await refusal(me);
  if (blocked) return say(blocked, 429);
  if (await prisma.floorPlan.count({ where: { ownerId: me } }) >= MAX_PLANS_PER_MINISTER) {
    return say(`Du har redan ${MAX_PLANS_PER_MINISTER} planlösningar. Ta bort någon först.`, 400);
  }

  try {
    return NextResponse.json(await start({ ownerId: me, image, listingUrl: url?.href ?? null, note }), { headers: noStore });
  }
  catch (err) {
    console.error("plan trace start:", err);
    if (err instanceof Anthropic.RateLimitError) return say("AI-tjänsten är överbelastad just nu. Försök igen om en stund.", 503);
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return say("Servern saknar giltig nyckel till AI-tjänsten.", 503);
    if (err instanceof Anthropic.APIError) return say("AI-tjänsten kunde inte starta ritningen.", 502);
    return say("Kunde inte starta ritningen.", 500);
  }
}
