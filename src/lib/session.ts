import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "riks_session";
export const OAUTH_STATE_COOKIE = "riks_oauth_state";
export const OAUTH_NEXT_COOKIE = "riks_oauth_next";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = "minister" | null;

export type Session = {
  userId: string; // Discord ID
  name: string;
  avatar: string; // Full avatar URL
  role: SessionRole;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set in environment variables");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(session: Session): Promise<string> {
  return await new SignJWT({
    name: session.name,
    avatar: session.avatar,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      avatar: typeof payload.avatar === "string" ? payload.avatar : "",
      role: payload.role === "minister" ? "minister" : null,
    };
  }
  catch {
    return null;
  }
}

/** Read and verify the session cookie. Server components and route handlers only. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;

export const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 10,
} as const;
