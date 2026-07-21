import { env } from "node:process";

/**
 * Exchange a stored Spotify refresh token for a fresh access token.
 * Spotify may rotate the refresh token; when it does, the new one is returned
 * and the caller must persist it back to the SpotifyAccount row.
 */
export async function refreshSpotifyAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  newRefreshToken: string | null;
} | null> {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = env;
  if (!SPOTIFY_CLIENT_ID) throw new Error("SPOTIFY_CLIENT_ID is not set in environment variables");
  if (!SPOTIFY_CLIENT_SECRET) throw new Error("SPOTIFY_CLIENT_SECRET is not set in environment variables");

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    console.error(`Spotify token refresh failed: ${response.status} ${await response.text()}`);
    return null;
  }

  const data = await response.json() as { access_token?: string; refresh_token?: string };
  if (!data.access_token) return null;
  return {
    accessToken: data.access_token,
    newRefreshToken: data.refresh_token ?? null,
  };
}
