import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { exchangeSpotifyCode } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "minister") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return failed(req);
  }

  const tokens = await exchangeSpotifyCode(code);
  if (!tokens) return failed(req);

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

  const response = NextResponse.redirect(new URL("/spotify", req.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

function failed(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/spotify?connect=failed", req.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
