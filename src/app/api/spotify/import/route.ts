import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSpotifyAppToken } from "@/lib/oauth";
import { prisma } from "@/lib/prisma/prisma";
import type { Prisma } from "@/lib/prisma/generated";

/**
 * Historic takeout import. Receives a chunk of plays parsed client-side from
 * "Streaming_History_Audio_*.json", fetches metadata for tracks the database
 * has not seen before, and inserts the plays for the logged-in user with
 * imported = true.
 *
 * Spotify's batch metadata endpoints (/v1/tracks?ids=, /v1/artists?ids=)
 * return 403 for this app (development-mode restriction), so metadata is
 * fetched one resource at a time. To keep each request short, at most
 * MAX_NEW_TRACKS_PER_REQUEST unknown tracks are resolved per call; while more
 * remain the response carries pending > 0 and the client re-sends the same
 * chunk until it drains.
 */

const MAX_PLAYS_PER_REQUEST = 1000;
const MAX_NEW_TRACKS_PER_REQUEST = 15;
const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/;

// Tracks Spotify no longer resolves (removed, local-only, or missing ISRC),
// remembered so retried chunks don't refetch them. Cleared on restart, which
// only costs one extra lookup round.
const unresolvableTrackIds = new Set<string>();

type ImportPlay = {
  trackId: string;
  playedAt: string; // ISO timestamp
};

// The bundled @types/spotify-api predates these fields; the API returns them
type SpotifyTrack = SpotifyApi.TrackObjectFull & {
  is_local?: boolean;
  album: SpotifyApi.AlbumObjectSimplified & { release_date?: string };
};

export type ImportResponse = {
  /** Unknown tracks still to resolve — re-send the same chunk while > 0 */
  pending: number;
  newTracks: number;
  received: number;
  inserted: number;
  duplicates: number;
  /** Plays whose track could not be resolved (removed from Spotify, local file, or missing ISRC) */
  unresolved: number;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  }
  catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plays = parsePlays(body);
  if (!plays) {
    return NextResponse.json(
      { error: `Expected { plays: { trackId, playedAt }[] } with at most ${MAX_PLAYS_PER_REQUEST} items` },
      { status: 400 },
    );
  }

  const uniqueTrackIds = [...new Set(plays.map((play) => play.trackId))];
  const existingTracks = await prisma.track.findMany({
    where: { id: { in: uniqueTrackIds } },
    select: { id: true },
  });
  const knownTrackIds = new Set(existingTracks.map((track) => track.id));
  const missingTrackIds = uniqueTrackIds
    .filter((id) => !knownTrackIds.has(id) && !unresolvableTrackIds.has(id));

  let newTracks = 0;
  if (missingTrackIds.length > 0) {
    const token = await getSpotifyAppToken();
    if (!token) {
      return NextResponse.json({ error: "Could not authenticate against Spotify" }, { status: 502 });
    }

    try {
      const created = await importMissingTracks(missingTrackIds.slice(0, MAX_NEW_TRACKS_PER_REQUEST), token);
      newTracks = created.length;
      for (const id of created) knownTrackIds.add(id);
    }
    catch (err) {
      console.error("Takeout import: metadata fetch failed:", err);
      return NextResponse.json({ error: "Spotify metadata fetch failed" }, { status: 502 });
    }
  }

  const pending = missingTrackIds.length - Math.min(missingTrackIds.length, MAX_NEW_TRACKS_PER_REQUEST);
  if (pending > 0) {
    // More tracks to resolve — plays are inserted once the chunk is fully resolved
    return NextResponse.json({
      pending,
      newTracks,
      received: plays.length,
      inserted: 0,
      duplicates: 0,
      unresolved: 0,
    } satisfies ImportResponse);
  }

  const insertablePlays = plays.filter((play) => knownTrackIds.has(play.trackId));
  const { count: inserted } = await prisma.trackPlay.createMany({
    skipDuplicates: true,
    data: insertablePlays.map((play) => ({
      playedAt: new Date(play.playedAt),
      userId: session.userId,
      trackId: play.trackId,
      imported: true,
    })) satisfies Prisma.TrackPlayCreateManyInput[],
  });

  return NextResponse.json({
    pending: 0,
    newTracks,
    received: plays.length,
    inserted,
    duplicates: insertablePlays.length - inserted,
    unresolved: plays.length - insertablePlays.length,
  } satisfies ImportResponse);
}

function parsePlays(body: unknown): ImportPlay[] | null {
  if (typeof body !== "object" || body === null) return null;
  const plays = (body as { plays?: unknown }).plays;
  if (!Array.isArray(plays) || plays.length === 0 || plays.length > MAX_PLAYS_PER_REQUEST) return null;

  const parsed: ImportPlay[] = [];
  for (const play of plays as unknown[]) {
    if (typeof play !== "object" || play === null) return null;
    const { trackId, playedAt } = play as { trackId?: unknown; playedAt?: unknown };
    if (typeof trackId !== "string" || !SPOTIFY_ID_REGEX.test(trackId)) return null;
    if (typeof playedAt !== "string" || isNaN(new Date(playedAt).getTime())) return null;
    parsed.push({ trackId, playedAt });
  }
  return parsed;
}

/**
 * Fetch metadata for unknown tracks and write Genres, Albums, Artists and
 * Tracks. Mirrors the backend's post-recent-plays upserts, minus image colors
 * (the seed-colors script backfills those). Returns the created track IDs.
 */
async function importMissingTracks(trackIds: string[], token: string): Promise<string[]> {
  const tracks: SpotifyTrack[] = [];
  for (const trackId of trackIds) {
    const track = await fetchSpotifyOne<SpotifyTrack>(`tracks/${trackId}`, token);
    if (!track || track.is_local || !track.external_ids.isrc) {
      if (track && !track.external_ids.isrc) {
        console.warn(`No ISRC found for track ${track.name} (${track.id}). Skipping.`);
      }
      unresolvableTrackIds.add(trackId);
      continue;
    }
    tracks.push(track);
  }
  if (tracks.length === 0) return [];

  const albums = uniqueById(tracks.map((track) => track.album));

  const artistIdsOnTracks = [...new Set(tracks.flatMap((track) => track.artists.map((artist) => artist.id)))];
  const existingArtistIds = new Set(
    (await prisma.artist.findMany({
      where: { id: { in: artistIdsOnTracks } },
      select: { id: true },
    })).map((artist) => artist.id),
  );

  const fetchedArtists: SpotifyApi.ArtistObjectFull[] = [];
  for (const artistId of artistIdsOnTracks.filter((id) => !existingArtistIds.has(id))) {
    const artist = await fetchSpotifyOne<SpotifyApi.ArtistObjectFull>(`artists/${artistId}`, token);
    if (artist) fetchedArtists.push(artist);
  }
  const knownArtistIds = new Set([...existingArtistIds, ...fetchedArtists.map((artist) => artist.id)]);

  // Insert in FK order. All writes are idempotent (skipDuplicates / connect),
  // so a failed request can simply be retried.
  await prisma.genre.createMany({
    skipDuplicates: true,
    data: fetchedArtists
      .flatMap((artist) => artist.genres)
      .map((genre) => ({ name: genre })) satisfies Prisma.GenreCreateManyInput[],
  });

  await prisma.album.createMany({
    skipDuplicates: true,
    data: albums.map((album) => ({
      id: album.id,
      name: album.name,
      url: album.external_urls.spotify,
      image: album.images[0]?.url || null,
      releaseDate: parseReleaseDate(album.release_date),
    })) satisfies Prisma.AlbumCreateManyInput[],
  });

  await prisma.artist.createMany({
    skipDuplicates: true,
    data: fetchedArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      url: artist.external_urls.spotify,
      image: artist.images[0]?.url || null,
    })) satisfies Prisma.ArtistCreateManyInput[],
  });

  for (const artist of fetchedArtists) {
    if (artist.genres.length === 0) continue;
    await prisma.artist.update({
      where: { id: artist.id },
      data: { genres: { connect: artist.genres.map((genre) => ({ name: genre })) } },
    });
  }

  await prisma.track.createMany({
    skipDuplicates: true,
    data: tracks.map((track) => ({
      id: track.id,
      name: track.name,
      url: track.external_urls.spotify,
      duration: track.duration_ms,
      albumId: track.album.id,
      ISRC: track.external_ids.isrc as string,
    })) satisfies Prisma.TrackCreateManyInput[],
  });

  for (const track of tracks) {
    const artistIds = track.artists
      .map((artist) => artist.id)
      .filter((id) => knownArtistIds.has(id));
    if (artistIds.length === 0) continue;
    await prisma.track.update({
      where: { id: track.id },
      data: { artists: { connect: artistIds.map((id) => ({ id })) } },
    });
  }

  return tracks.map((track) => track.id);
}

/**
 * Single-resource metadata fetch with 429 handling. Returns null when the
 * resource does not exist (removed from Spotify); throws on other failures so
 * the whole request fails retryably instead of silently dropping data.
 */
async function fetchSpotifyOne<T>(path: string, token: string): Promise<T | null> {
  const url = `https://api.spotify.com/v1/${path}`;

  let response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 429) {
    const retryAfter = Math.min(Number(response.headers.get("Retry-After") ?? 1), 30);
    await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw new Error(`Spotify ${path} failed: ${response.status} ${await response.text()}`);
  }
  return await response.json() as T;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!seen.has(item.id)) seen.set(item.id, item);
  }
  return [...seen.values()];
}

function parseReleaseDate(releaseDate: string | undefined): Date | null {
  if (!releaseDate) return null;
  const date = new Date(releaseDate);
  return isNaN(date.getTime()) ? null : date;
}
