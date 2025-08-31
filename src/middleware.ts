import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { hasRole } from "./lib/auth";

const isMinisterRoute = createRouteMatcher([
  "/spotify(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect tailscale to public domain TODO: remove once tailscale funnel is gone
  if (req.headers.get("x-forwarded-host")?.includes("dev.ts.net")) {
    console.log("redirecting to public domain");
    const newURL = new URL(`https://dev.riksdagen.net${req.nextUrl.pathname}`, req.url)
    return NextResponse.redirect(newURL, 301);
  }

  // Allow ministers to access protected routes
  if (isMinisterRoute(req)) {
    // Is not signed in, 404
    if (!(await auth()).userId) {
      return notFound();
    }

    // Allow if minister
    if (await hasRole(auth, "minister")) {
      return NextResponse.next();
    }
    // Hide protected routes
    else {
      return notFound();
    }
  }

  // Public routes
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