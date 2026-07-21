import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { discordAvatarUrl, exchangeDiscordCode, fetchDiscordUser } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/session";
import { prisma } from "@/lib/prisma/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return failed(req);
  }

  const accessToken = await exchangeDiscordCode(code);
  if (!accessToken) return failed(req);

  const discordUser = await fetchDiscordUser(accessToken);
  if (!discordUser) return failed(req);

  // Ministers are the users the backend's make-users job has put in the User table
  const dbUser = await prisma.user.findUnique({ where: { id: discordUser.id } });

  const token = await signSessionToken({
    userId: discordUser.id,
    name: dbUser?.name ?? discordUser.global_name ?? discordUser.username,
    avatar: discordAvatarUrl(discordUser),
    role: dbUser ? "minister" : null,
  });

  const response = NextResponse.redirect(new URL("/", req.url));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

function failed(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/?login=failed", req.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
