import { NextResponse } from "next/server";
import { appUrl, spotifyAuthorizeUrl } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, getSession, stateCookieOptions } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "minister") {
    return NextResponse.redirect(appUrl("/"));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(spotifyAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions);
  return response;
}
