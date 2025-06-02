import type { NextRequest } from "next/server";
import { isMinister } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Auth user 
  if (!isMinister()) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { filter, trackIds } = body;
}