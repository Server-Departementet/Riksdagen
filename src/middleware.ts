import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/statsskick",
  "/ministrar/(.*)",
  "/api/spotify/post",
]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect tailscale to public domain
  if (req.headers.get("x-forwarded-host")?.includes("dev.ts.net")) {
    console.log("redirecting to public domain");
    const newURL = new URL(`https://dev.riksdagen.net${req.nextUrl.pathname}`, req.url)
    return NextResponse.redirect(newURL, 301);
  }

  // Protected routes
  if (!isPublicRoute(req)) {
    console.log((await auth()).has({ role: "minister" }));
    await auth.protect({ role: "minister" });
  }
  // Public routes
  else {
    return NextResponse.next();
  }

  return NextResponse.json("Bad request", { status: 400 });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};