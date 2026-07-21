import "server-only";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in environment variables`);
  return value;
}

export function callbackUrl(provider: "discord" | "spotify"): string {
  return `${requiredEnv("CANONICAL_URL")}/api/auth/callback/${provider}`;
}

/**
 * Absolute app URL for redirects. Built from CANONICAL_URL because the
 * standalone server reconstructs req.url from its bind address (0.0.0.0:3000)
 * behind the reverse proxy.
 */
export function appUrl(path: string): string {
  return new URL(path, requiredEnv("CANONICAL_URL")).toString();
}

/**
 * Only accept same-origin paths as post-login redirect targets, so a crafted
 * login link can't bounce users to another site.
 */
export function safeReturnPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  if (path.startsWith("/api/")) return null;
  return path;
}

/*
 * Discord (login)
 */

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export function discordAuthorizeUrl(state: string): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", requiredEnv("DISCORD_CLIENT_ID"));
  url.searchParams.set("redirect_uri", callbackUrl("discord"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeDiscordCode(code: string): Promise<string | null> {
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requiredEnv("DISCORD_CLIENT_ID"),
      client_secret: requiredEnv("DISCORD_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl("discord"),
    }),
  });
  if (!response.ok) {
    console.error(`Discord token exchange failed: ${response.status} ${await response.text()}`);
    return null;
  }
  const data = await response.json() as { access_token?: string };
  return data.access_token ?? null;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error(`Discord user fetch failed: ${response.status} ${await response.text()}`);
    return null;
  }
  return await response.json() as DiscordUser;
}

export function discordAvatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  const defaultIndex = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

/*
 * Spotify (connect account, so the backend's post-recent-plays job can fetch plays)
 */

export function spotifyAuthorizeUrl(state: string): string {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", requiredEnv("SPOTIFY_CLIENT_ID"));
  url.searchParams.set("redirect_uri", callbackUrl("spotify"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user-read-recently-played");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeSpotifyCode(code: string): Promise<{ refreshToken: string; scope: string | null } | null> {
  const basic = Buffer
    .from(`${requiredEnv("SPOTIFY_CLIENT_ID")}:${requiredEnv("SPOTIFY_CLIENT_SECRET")}`)
    .toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl("spotify"),
    }),
  });
  if (!response.ok) {
    console.error(`Spotify token exchange failed: ${response.status} ${await response.text()}`);
    return null;
  }
  const data = await response.json() as { refresh_token?: string; scope?: string };
  if (!data.refresh_token) return null;
  return { refreshToken: data.refresh_token, scope: data.scope ?? null };
}
