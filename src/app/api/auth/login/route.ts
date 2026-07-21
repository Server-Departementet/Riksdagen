import { NextResponse } from "next/server";
import { discordAuthorizeUrl } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, stateCookieOptions } from "@/lib/session";

export function GET() {
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(discordAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions);
  return response;
}
