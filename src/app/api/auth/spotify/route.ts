import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { spotifyAuthorizeUrl } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, getSession, stateCookieOptions } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "minister") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(spotifyAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions);
  return response;
}
