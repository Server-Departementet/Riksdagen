import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const ministerRoutes = [
  "/spotify",
  "/citat",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ministerRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (session?.role !== "minister") {
      return notFound(req);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Allow public
    "/(public|trpc)(.*)",

    // Always run for API routes
    "/(api|trpc)(.*)",

    // Protected routes
    "/spotify(.*)",
    "/citat(.*)",
  ],
};

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", req.url));
}
