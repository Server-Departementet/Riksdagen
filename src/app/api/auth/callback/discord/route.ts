import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appUrl, discordAvatarUrl, exchangeDiscordCode, fetchDiscordUser, safeReturnPath } from "@/lib/oauth";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/session";
import { prisma } from "@/lib/prisma/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return failed();
  }

  const accessToken = await exchangeDiscordCode(code);
  if (!accessToken) return failed();

  const discordUser = await fetchDiscordUser(accessToken);
  if (!discordUser) return failed();

  // Ministers are the users the backend's make-users job has put in the User table
  const dbUser = await prisma.user.findUnique({ where: { id: discordUser.id } });

  const token = await signSessionToken({
    userId: discordUser.id,
    name: dbUser?.name ?? discordUser.global_name ?? discordUser.username,
    avatar: discordAvatarUrl(discordUser),
    role: dbUser ? "minister" : null,
  });

  const next = safeReturnPath(req.cookies.get(OAUTH_NEXT_COOKIE)?.value) ?? "/";
  const response = NextResponse.redirect(appUrl(next));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

function failed() {
  const response = NextResponse.redirect(appUrl("/?login=failed"));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}
