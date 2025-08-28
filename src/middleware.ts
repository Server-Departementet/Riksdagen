import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isMinister } from "./lib/auth";

const isSpotifyRoute = createRouteMatcher(["/spotify(.*)"]);

export default clerkMiddleware(async (_auth, req) => {

  // Redirect tailscale to public domain
  if (req.headers.get("x-forwarded-host")?.includes("dev.ts.net")) {
    console.log("redirecting to public domain");
    const newURL = new URL(`https://dev.riksdagen.net${req.nextUrl.pathname}`, req.url)
    return NextResponse.redirect(newURL, 301);
  }

  // Spotify protected route
  if (isSpotifyRoute(req) && !isMinister()) notFound(req);

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", req.url));
}