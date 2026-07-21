import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appUrl, exchangeSpotifyCode } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "minister") {
    return NextResponse.redirect(appUrl("/"));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return failed();
  }

  const tokens = await exchangeSpotifyCode(code);
  if (!tokens) return failed();

  await prisma.spotifyAccount.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope,
    },
    update: {
      refreshToken: tokens.refreshToken,
      scope: tokens.scope,
    },
  });

  const response = NextResponse.redirect(appUrl("/spotify"));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

function failed() {
  const response = NextResponse.redirect(appUrl("/spotify?connect=failed"));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
