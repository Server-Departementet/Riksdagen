import "dotenv/config";
import type { Prisma } from "@/lib/prisma/generated";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "@/lib/prisma";
import { filterNearDuplicatePlays, PLAY_DEDUPE_TOLERANCE_MS } from "@/lib/play-dedupe";

/**
 * Drains the takeout import queue (ImportQueueItem, filled by
 * /api/spotify/import) at a deliberately slow pace. Each run resolves at most
 * TRACKS_PER_RUN unknown tracks against Spotify with CALL_SPACING_MS between
 * every call, then inserts all queued plays whose tracks are known. A large
 * import therefore finishes over hours or days without ever hammering the
 * dev-mode-restricted Spotify app; runs are stateless and resume where the
 * last one stopped. Runs from cron (see systemd/cron, guarded by flock).
 */

const TRACKS_PER_RUN = 20;
const CALL_SPACING_MS = 1500;
const ID_CHUNK = 1000; // Max ids per IN-clause
const FLUSH_TRACK_CHUNK = 300; // Track ids per flush batch
const DONE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const FAILED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const prisma = new PrismaClient(makeMariaDBAdapter(process.env.DATABASE_URL));

/** Thrown when Spotify keeps rate-limiting — the run stops and cron retries later. */
class SpotifyBackoff extends Error {}

// The bundled @types/spotify-api predates these fields; the API returns them
type SpotifyTrack = SpotifyApi.TrackObjectFull & {
  is_local?: boolean;
  album: SpotifyApi.AlbumObjectSimplified & { release_date?: string };
};
type SpotifyArtist = Omit<SpotifyApi.ArtistObjectFull, "genres"> & { genres?: string[] };

processQueue()
  .then(() => {
    console.info("Finished processing import queue.");
    process.exitCode = 0;
  })
  .catch((err: unknown) => {
    console.error("Error processing import queue:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect()
      .catch((err: unknown) => {
        console.error("Error disconnecting Prisma:", err);
      })
      .finally(() => process.exit());
  });

async function processQueue() {
  const pendingTrackGroups = await prisma.importQueueItem.groupBy({
    by: ["trackId"],
    where: { status: "pending" },
  });
  if (pendingTrackGroups.length === 0) {
    await prune();
    return;
  }
  const pendingTrackIds = pendingTrackGroups.map((group) => group.trackId);
  console.info(`Queue has plays for ${pendingTrackIds.length} distinct tracks.`);

  const knownTrackIds = await findKnownTrackIds(pendingTrackIds);
  const unknownTrackIds = pendingTrackIds.filter((id) => !knownTrackIds.has(id));
  console.info(`${knownTrackIds.size} tracks already in the catalog, ${unknownTrackIds.length} unknown.`);

  /*
   * Resolve a bounded number of unknown tracks against Spotify
   */
  if (unknownTrackIds.length > 0) {
    const batch = unknownTrackIds.slice(0, TRACKS_PER_RUN);
    try {
      const { created, unresolvable } = await importMissingTracks(batch);
      for (const id of created) knownTrackIds.add(id);
      if (unresolvable.length > 0) {
        const { count } = await prisma.importQueueItem.updateMany({
          where: { trackId: { in: unresolvable }, status: "pending" },
          data: { status: "failed", reason: "Låten kunde inte matchas mot Spotify" },
        });
        console.info(`Marked ${count} plays failed (${unresolvable.length} unresolvable tracks).`);
      }
    }
    catch (err) {
      if (err instanceof SpotifyBackoff) {
        console.warn("Spotify keeps rate-limiting; stopping early. The next run resumes.");
      }
      else {
        console.error("Metadata fetch failed; flushing what is known and stopping:", err);
      }
    }
  }

  /*
   * Insert all queued plays whose tracks are now known, per user
   */
  const runAt = new Date();
  const userGroups = await prisma.importQueueItem.groupBy({
    by: ["userId"],
    where: { status: "pending" },
  });
  for (const { userId } of userGroups) {
    const userTrackGroups = await prisma.importQueueItem.groupBy({
      by: ["trackId"],
      where: { userId, status: "pending" },
    });
    const flushableTrackIds = userTrackGroups
      .map((group) => group.trackId)
      .filter((id) => knownTrackIds.has(id));

    let inserted = 0;
    let duplicates = 0;
    for (let i = 0; i < flushableTrackIds.length; i += FLUSH_TRACK_CHUNK) {
      const chunkIds = flushableTrackIds.slice(i, i + FLUSH_TRACK_CHUNK);
      const rows = await prisma.importQueueItem.findMany({
        where: { userId, status: "pending", trackId: { in: chunkIds } },
        select: { id: true, trackId: true, playedAt: true },
      });
      if (rows.length === 0) continue;

      // The recently-played job records the same play with a timestamp seconds
      // off from the takeout's; drop candidates near a job-recorded play.
      // Exact re-imports collide on the TrackPlay PK and are absorbed there.
      const playTimes = rows.map((row) => row.playedAt.getTime());
      const storedPlays = await prisma.trackPlay.findMany({
        where: {
          userId,
          imported: false,
          trackId: { in: chunkIds },
          playedAt: {
            gte: new Date(Math.min(...playTimes) - PLAY_DEDUPE_TOLERANCE_MS),
            lte: new Date(Math.max(...playTimes) + PLAY_DEDUPE_TOLERANCE_MS),
          },
        },
        select: { trackId: true, playedAt: true },
      });
      const survivors = filterNearDuplicatePlays(rows, storedPlays);
      const survivorIds = new Set(survivors.map((row) => row.id));

      const { count } = await prisma.trackPlay.createMany({
        skipDuplicates: true,
        data: survivors.map((row) => ({
          userId,
          trackId: row.trackId,
          playedAt: row.playedAt,
          imported: true,
        })) satisfies Prisma.TrackPlayCreateManyInput[],
      });
      inserted += count;
      duplicates += rows.length - count;

      // Survivors are now in TrackPlay (inserted or PK-collided) — done.
      // Tolerance-filtered rows were already stored by the job — duplicates.
      await prisma.importQueueItem.updateMany({
        where: { id: { in: survivors.map((row) => row.id) } },
        data: { status: "done" },
      });
      const filteredIds = rows.filter((row) => !survivorIds.has(row.id)).map((row) => row.id);
      if (filteredIds.length > 0) {
        await prisma.importQueueItem.updateMany({
          where: { id: { in: filteredIds } },
          data: { status: "duplicate" },
        });
      }
    }

    if (inserted + duplicates > 0) {
      const stillPending = await prisma.importQueueItem.count({ where: { userId, status: "pending" } });
      console.info(`User ${userId}: inserted ${inserted}, duplicates ${duplicates}, ${stillPending} still pending.`);
      // Surface progress on /spotify/log alongside the recently-played runs
      await prisma.trackPlayFetch.create({
        data: {
          runAt,
          userId,
          status: "import",
          inserted,
          skipped: duplicates,
          detail: stillPending > 0 ? `${stillPending} spelningar väntar på låtinfo` : "Importen är klar",
        },
      }).catch((err: unknown) => {
        console.error("Error recording import log:", err);
      });
    }
  }

  await prune();
}

async function findKnownTrackIds(trackIds: string[]): Promise<Set<string>> {
  const known = new Set<string>();
  for (let i = 0; i < trackIds.length; i += ID_CHUNK) {
    const chunk = trackIds.slice(i, i + ID_CHUNK);
    const tracks = await prisma.track.findMany({
      where: { id: { in: chunk } },
      select: { id: true },
    });
    for (const track of tracks) known.add(track.id);
  }
  return known;
}

async function prune() {
  const { count } = await prisma.importQueueItem.deleteMany({
    where: {
      OR: [
        { status: { in: ["done", "duplicate"] }, queuedAt: { lt: new Date(Date.now() - DONE_RETENTION_MS) } },
        { status: "failed", queuedAt: { lt: new Date(Date.now() - FAILED_RETENTION_MS) } },
      ],
    },
  });
  if (count > 0) console.info(`Pruned ${count} finished queue rows.`);
}

/**
 * Fetch metadata for unknown tracks and write Genres, Albums, Artists and
 * Tracks, with CALL_SPACING_MS between every Spotify call. Mirrors the
 * recently-played upserts, minus image colors (seed-colors backfills those).
 */
async function importMissingTracks(trackIds: string[]): Promise<{ created: string[]; unresolvable: string[] }> {
  const token = await getSpotifyAppToken();

  const tracks: SpotifyTrack[] = [];
  const unresolvable: string[] = [];
  for (const trackId of trackIds) {
    const track = await fetchSpotifyOne<SpotifyTrack>(`tracks/${trackId}`, token);
    if (!track || track.is_local || !track.external_ids.isrc) {
      if (track && !track.external_ids.isrc) {
        console.warn(`No ISRC found for track ${track.name} (${track.id}). Skipping.`);
      }
      unresolvable.push(trackId);
      continue;
    }
    tracks.push(track);
  }
  if (tracks.length === 0) return { created: [], unresolvable };

  const albums = [...new Map(tracks.map((track) => [track.album.id, track.album])).values()];

  const artistIdsOnTracks = [...new Set(tracks.flatMap((track) => track.artists.map((artist) => artist.id)))];
  const existingArtistIds = new Set(
    (await prisma.artist.findMany({
      where: { id: { in: artistIdsOnTracks } },
      select: { id: true },
    })).map((artist) => artist.id),
  );

  const fetchedArtists: SpotifyArtist[] = [];
  for (const artistId of artistIdsOnTracks.filter((id) => !existingArtistIds.has(id))) {
    const artist = await fetchSpotifyOne<SpotifyArtist>(`artists/${artistId}`, token);
    if (artist) fetchedArtists.push(artist);
  }
  const knownArtistIds = new Set([...existingArtistIds, ...fetchedArtists.map((artist) => artist.id)]);

  // Insert in FK order. All writes are idempotent (skipDuplicates / connect),
  // so a failed run can simply be retried.
  await prisma.genre.createMany({
    skipDuplicates: true,
    data: fetchedArtists
      .flatMap((artist) => artist.genres ?? [])
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
    if (!artist.genres?.length) continue;
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

  console.info(`Created ${tracks.length} tracks (${fetchedArtists.length} new artists).`);
  return { created: tracks.map((track) => track.id), unresolvable };
}

/**
 * Single-resource metadata fetch. Every call is preceded by a spacing sleep;
 * a 429 waits out Retry-After once, then a second 429 aborts the whole run.
 * Returns null when the resource does not exist (removed from Spotify).
 */
async function fetchSpotifyOne<T>(path: string, token: string): Promise<T | null> {
  const url = `https://api.spotify.com/v1/${path}`;
  await sleep(CALL_SPACING_MS);

  let response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 429) {
    const retryAfter = Math.min(Number(response.headers.get("Retry-After") ?? 1), 60);
    console.warn(`429 on ${path}, waiting ${retryAfter}s.`);
    await sleep((retryAfter + 1) * 1000);
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (response.status === 429) throw new SpotifyBackoff(`Still rate-limited on ${path}`);
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw new Error(`Spotify ${path} failed: ${response.status} ${await response.text()}`);
  }
  return await response.json() as T;
}

async function getSpotifyAppToken(): Promise<string> {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  if (!SPOTIFY_CLIENT_ID) throw new Error("SPOTIFY_CLIENT_ID is not set in environment variables");
  if (!SPOTIFY_CLIENT_SECRET) throw new Error("SPOTIFY_CLIENT_SECRET is not set in environment variables");

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!response.ok) {
    throw new Error(`Spotify client credentials token failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Spotify token response had no access_token");
  return data.access_token;
}

function parseReleaseDate(releaseDate?: string): Date | null {
  if (!releaseDate) return null;
  // Spotify precision can be "yyyy" or "yyyy-MM" — Date handles all three forms
  const date = new Date(releaseDate);
  return isNaN(date.getTime()) ? null : date;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
