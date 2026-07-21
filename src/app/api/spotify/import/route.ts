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
 */

const MAX_PLAYS_PER_REQUEST = 1000;
const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/;
const SPOTIFY_BATCH_SIZE = 50;

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
  received: number;
  inserted: number;
  duplicates: number;
  /** Plays whose track could not be resolved (removed from Spotify, local file, or missing ISRC) */
  unresolved: number;
  newTracks: number;
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
  const missingTrackIds = uniqueTrackIds.filter((id) => !knownTrackIds.has(id));

  let newTracks = 0;
  if (missingTrackIds.length > 0) {
    const token = await getSpotifyAppToken();
    if (!token) {
      return NextResponse.json({ error: "Could not authenticate against Spotify" }, { status: 502 });
    }

    const created = await importMissingTracks(missingTrackIds, token);
    newTracks = created.length;
    for (const id of created) knownTrackIds.add(id);
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
    received: plays.length,
    inserted,
    duplicates: insertablePlays.length - inserted,
    unresolved: plays.length - insertablePlays.length,
    newTracks,
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
  const tracks = (await fetchSpotifyBatches<SpotifyTrack>("tracks", trackIds, token))
    .filter((track) => !track.is_local)
    .filter((track) => {
      if (track.external_ids.isrc) return true;
      console.warn(`No ISRC found for track ${track.name} (${track.id}). Skipping.`);
      return false;
    });
  if (tracks.length === 0) return [];

  const albums = uniqueById(tracks.map((track) => track.album));

  const artistIdsOnTracks = [...new Set(tracks.flatMap((track) => track.artists.map((artist) => artist.id)))];
  const existingArtistIds = new Set(
    (await prisma.artist.findMany({
      where: { id: { in: artistIdsOnTracks } },
      select: { id: true },
    })).map((artist) => artist.id),
  );
  const fetchedArtists = await fetchSpotifyBatches<SpotifyApi.ArtistObjectFull>(
    "artists",
    artistIdsOnTracks.filter((id) => !existingArtistIds.has(id)),
    token,
  );
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

/** Batch metadata fetch (/v1/tracks or /v1/artists, 50 IDs per call) with basic 429 handling. */
async function fetchSpotifyBatches<T>(
  endpoint: "tracks" | "artists",
  ids: string[],
  token: string,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < ids.length; i += SPOTIFY_BATCH_SIZE) {
    const batch = ids.slice(i, i + SPOTIFY_BATCH_SIZE);
    const url = `https://api.spotify.com/v1/${endpoint}?ids=${batch.join(",")}`;

    let response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 429) {
      const retryAfter = Math.min(Number(response.headers.get("Retry-After") ?? 1), 30);
      await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
      response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    }
    if (!response.ok) {
      console.error(`Spotify ${endpoint} batch failed: ${response.status} ${await response.text()}`);
      continue;
    }

    // Unknown IDs come back as null entries
    const data = await response.json() as Record<string, (T | null)[]>;
    results.push(...(data[endpoint] ?? []).filter((item): item is T => item !== null));
  }

  return results;
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
