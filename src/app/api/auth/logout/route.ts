import { NextResponse } from "next/server";
import { appUrl } from "@/lib/oauth";
import { SESSION_COOKIE } from "@/lib/session";

export function GET() {
  const response = NextResponse.redirect(appUrl("/"));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
