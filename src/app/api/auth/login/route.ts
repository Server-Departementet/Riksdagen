import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { discordAuthorizeUrl, safeReturnPath } from "@/lib/oauth";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, stateCookieOptions } from "@/lib/session";

export function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(discordAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions);

  const next = safeReturnPath(req.nextUrl.searchParams.get("next")) ?? refererPath(req);
  if (next) response.cookies.set(OAUTH_NEXT_COOKIE, next, stateCookieOptions);
  else response.cookies.delete(OAUTH_NEXT_COOKIE);

  return response;
}

function refererPath(req: NextRequest): string | null {
  const referer = req.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return safeReturnPath(url.pathname + url.search);
  }
  catch {
    return null;
  }
}
