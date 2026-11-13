import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_IMAGE_BYTES, PLAN_ID_REGEX, sniffImageType } from "@/lib/planner/plan";

/*
 * The plan image a flat is traced from. It lives in the database rather than on
 * disk because a deploy replaces the whole standalone directory.
 * Readable by every minister, writable by the plan's owner. The browser crops
 * and shrinks the image before it gets here; the body is the raw file.
 */

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function ministerId(): Promise<string | null> {
  const session = await auth();
  return session?.role === "minister" ? session.userId : null;
}

export async function GET(_req: NextRequest, { params }: Context) {
  if (!await ministerId()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const row = PLAN_ID_REGEX.test(id)
    ? await prisma.floorPlan.findUnique({ where: { id }, select: { image: true, imageType: true } })
    : null;
  if (!row?.image || !row.imageType) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(row.image), {
    headers: {
      "Content-Type": row.imageType,
      // The planner asks for ?rev=<upload time>, so a replaced image gets a new URL.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PUT(req: NextRequest, { params }: Context) {
  const me = await ministerId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  if (!PLAN_ID_REGEX.test(id)) return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });

  if (Number(req.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image too large" }, { status: 413 });
  const imageType = sniffImageType(bytes);
  if (!imageType) return NextResponse.json({ error: "Expected a PNG, JPEG or WebP image" }, { status: 400 });

  const { count } = await prisma.floorPlan.updateMany({ where: { id, ownerId: me }, data: { image: bytes, imageType } });
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
