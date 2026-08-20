import "dotenv/config";
import { extractImageColor } from "./extract-image-color";
import type { Prisma } from "@/lib/prisma/generated";
import { PrismaClient } from "@/lib/prisma/generated";
import { makeMariaDBAdapter } from "@/lib/prisma";
import { refreshSpotifyAccessToken } from "./spotify-auth";
import type SpotifyApi from "spotify-web-api-node";
import type { UsersRecentlyPlayedTracksResponse } from "./spotify-types";

// Import each connected minister's recently played Spotify tracks into this
// environment's own database. Runs from cron on each web server (systemd/cron).
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in environment variables");
const DATABASE_URL = process.env.DATABASE_URL;

// Both environments poll the same Spotify accounts; set COLLECT_RECENT_PLAYS="false"
// on an environment (e.g. dev, which is refreshed from prod dumps) to spare the
// dev-mode Spotify app's rate limits.
if (process.env.COLLECT_RECENT_PLAYS === "false") {
  console.info("COLLECT_RECENT_PLAYS is false, skipping.");
  process.exit(0);
}

addRecentTrackPlays()
  .then(() => {
    console.log("Finished adding recent track plays.");
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error("Error adding recent track plays:", err);
    process.exit(1);
  });

async function addRecentTrackPlays() {
  console.info("Starting recent track plays import.");

  const prisma = new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

  // Every user's outcome this run is recorded under one timestamp and shown
  // on /spotify/log, so ministers can check their own imports
  const runAt = new Date();
  async function logFetch(userId: string, status: string, inserted: number, skipped: number, detail?: string) {
    await prisma.trackPlayFetch.create({ data: { runAt, userId, status, inserted, skipped, detail } })
      .catch((err: unknown) => {
        console.error("Error recording fetch log:", err);
      });
  }

  try {
    console.info("Fetching connected Spotify accounts.");
    const spotifyAccounts = await prisma.spotifyAccount.findMany({ include: { user: true } });
    console.info(`Found ${spotifyAccounts.length} connected Spotify accounts.`);

    for (const account of spotifyAccounts) {
      const dbUser = account.user;
      const username = dbUser.name ?? dbUser.id;
      console.info(`Processing user: ${username} (${dbUser.id}).`);

      /*
       * Get a fresh spotify access token for the user
       */
      const refreshed = await refreshSpotifyAccessToken(account.refreshToken);
      if (!refreshed) {
        console.warn(`Could not refresh Spotify token for user: ${username}. They may need to reconnect at /spotify.`);
        await logFetch(dbUser.id, "token-failed", 0, 0, "Koppla om ditt Spotify-konto på /spotify");
        continue;
      }
      if (refreshed.newRefreshToken) {
        await prisma.spotifyAccount.update({
          where: { userId: dbUser.id },
          data: { refreshToken: refreshed.newRefreshToken },
        });
      }
      const spotifyToken = refreshed.accessToken;
      console.info(`Spotify token resolved for ${username}.`);

      /*
       * Get recently played tracks from Spotify API
       */
      const recentlyPlayedTracks = await getRecentlyPlayedTracks(spotifyToken, username);
      if (!recentlyPlayedTracks) {
        await logFetch(dbUser.id, "fetch-failed", 0, 0, "Spotify svarade med fel");
        continue;
      }
      if (recentlyPlayedTracks.items.length === 0) {
        console.info(`No recently played tracks found for user: ${username}`);
        await logFetch(dbUser.id, "ok", 0, 0);
        continue;
      }
      console.info(`Fetched ${recentlyPlayedTracks.items.length} recent plays for ${username}.`);

      /* 
       * Prepare data for upserting to database
       */
      const existingArtistIds = await prisma.artist.findMany({ select: { id: true } });
      const missingArtistsSimple = recentlyPlayedTracks.items
        .flatMap((item) => item.track.artists as SpotifyApi.ArtistObjectSimplified[])
        .filter((artist) => !existingArtistIds.find((a) => a.id === artist.id));
      console.info(`Missing artists to fetch: ${missingArtistsSimple.length}.`);
      const artists = await getSpotifyArtists(missingArtistsSimple, spotifyToken);
      const genres = artists.flatMap((artist) => artist.genres ?? []);
      const albums = recentlyPlayedTracks.items.map((item) => item.track.album);
      const tracks = [...new Map(recentlyPlayedTracks.items.map((item) => [item.track.id, item.track])).values()];
      console.info(`Prepared ${artists.length} artists, ${albums.length} albums, ${tracks.length} tracks, ${genres.length} genres.`);

      // Recently-played track objects no longer include external_ids, so ISRCs
      // for tracks new to the database are resolved via the single-track endpoint
      const existingTrackIds = new Set(
        (await prisma.track.findMany({
          where: { id: { in: tracks.map((track) => track.id) } },
          select: { id: true },
        })).map((track) => track.id),
      );
      const isrcByTrackId: Record<string, string> = {};
      for (const track of tracks) {
        if (existingTrackIds.has(track.id)) continue;
        const isrc = track.external_ids?.isrc ?? await getTrackISRC(track.id, spotifyToken);
        if (isrc) isrcByTrackId[track.id] = isrc;
        else console.warn(`No ISRC found for track ${track.name} (${track.id}). Skipping.`);
      }

      // Colors
      const colors: Record<string, string> = {};
      const allImageUrls = [
        ...artists.map((artist) => artist.images[0]?.url).filter((url): url is string => !!url),
        ...albums.map((album) => album.images[0]?.url).filter((url): url is string => !!url),
      ];
      await Promise.all(allImageUrls.map(async (url) => {
        if (colors[url]) return;
        const color = await extractImageColor(url);
        if (!color) return;
        colors[url] = color;
      }));
      console.info(`Resolved ${Object.keys(colors).length} image colors.`);

      /* 
       * Write Genres, Artists, Albums, Tracks and TrackPlays to database
       */
      const counts = await prisma.$transaction(async (prisma) => {
        console.info(`Writing data for ${username} in a transaction.`);
        // Insert Genres, skip dupes
        await prisma.genre.createMany({
          skipDuplicates: true,
          data: [
            ...genres.map((genre) => ({ name: genre })),
          ] satisfies Prisma.GenreCreateManyInput[],
        });


        // Upsert Albums
        for (const album of albums) {
          const imageUrl = album.images[0]?.url || null;
          await prisma.album.upsert({
            where: { id: album.id },
            update: {
              name: album.name,
              url: album.external_urls.spotify,
              image: imageUrl,
              color: imageUrl ? colors[imageUrl] : undefined,
              releaseDate: new Date(album.release_date),
            },
            create: {
              id: album.id,
              name: album.name,
              url: album.external_urls.spotify,
              image: imageUrl,
              color: imageUrl ? colors[imageUrl] : undefined,
              releaseDate: new Date(album.release_date),
            },
          });
        }

        // Upsert tracks
        for (const track of tracks) {
          const ISRC = isrcByTrackId[track.id];
          if (!ISRC) {
            if (!existingTrackIds.has(track.id)) continue; // No ISRC resolvable, warned above
            // Known track: refresh metadata, keep the stored ISRC
            await prisma.track.update({
              where: { id: track.id },
              data: {
                name: track.name,
                url: track.external_urls.spotify,
                duration: track.duration_ms,
                albumId: track.album.id,
              },
            });
            continue;
          }

          await prisma.track.upsert({
            where: { id: track.id },
            update: {
              name: track.name,
              url: track.external_urls.spotify,
              duration: track.duration_ms,
              albumId: track.album.id,
              ISRC,
            },
            create: {
              id: track.id,
              name: track.name,
              url: track.external_urls.spotify,
              duration: track.duration_ms,
              albumId: track.album.id,
              ISRC,
            },
          });
        }

        // Upsert Artists
        for (const artist of artists) {
          const imageUrl = artist.images[0]?.url || null;
          await prisma.artist.upsert({
            where: { id: artist.id },
            update: {
              name: artist.name,
              url: artist.external_urls.spotify,
              image: imageUrl,
              color: imageUrl ? colors[imageUrl] : undefined,
              genres: {
                connect: (artist.genres ?? []).map((genre) => ({ name: genre })),
              },
              tracks: {
                connect: tracks
                  .filter((track) => existingTrackIds.has(track.id) || isrcByTrackId[track.id])
                  .filter((track) => track.artists.some((a) => a.id === artist.id))
                  .map((track) => ({ id: track.id })),
              },
            },
            create: {
              id: artist.id,
              name: artist.name,
              url: artist.external_urls.spotify,
              image: imageUrl,
              color: imageUrl ? colors[imageUrl] : undefined,
              genres: {
                connect: (artist.genres ?? []).map((genre) => ({ name: genre })),
              },
              tracks: {
                connect: tracks
                  .filter((track) => existingTrackIds.has(track.id) || isrcByTrackId[track.id])
                  .filter((track) => track.artists.some((a) => a.id === artist.id))
                  .map((track) => ({ id: track.id })),
              },
            },
          });
        }

        // Really ensure Track-Artist relations
        const knownArtistIds = new Set([
          ...existingArtistIds.map((a) => a.id),
          ...artists.map((a) => a.id),
        ]);
        for (const track of tracks) {
          // Skip tracks that are not in the database (no ISRC resolvable)
          if (!existingTrackIds.has(track.id) && !isrcByTrackId[track.id]) continue;
          for (const artist of track.artists) {
            // Skip artists that are not in the database (fetch failed)
            if (!knownArtistIds.has(artist.id)) continue;
            await prisma.track.update({
              where: { id: track.id },
              data: { artists: { connect: { id: artist.id } } },
            });
          }
        }

        // Insert TrackPlays, skip dupes. Plays for tracks that could not be
        // created (no ISRC) are dropped — they would violate the FK
        const candidatePlays = recentlyPlayedTracks.items
          .filter((item) => existingTrackIds.has(item.track.id) || isrcByTrackId[item.track.id])
          .map((item) => ({
            playedAt: new Date(item.played_at),
            userId: dbUser.id,
            trackId: item.track.id,
          })) satisfies Prisma.TrackPlayCreateManyInput[];

        // The API reports played_at exactly as it stored it, so re-reading the same play
        // across runs collides on the (trackId, playedAt, userId) PK and skipDuplicates
        // handles it. No tolerance window here — a repeat play seconds after the last one
        // is real listening, and dropping it loses data permanently. Takeout imports are
        // the only source with drifting timestamps, and they dedupe on their own side.
        const inserted = await prisma.trackPlay.createMany({
          skipDuplicates: true,
          data: candidatePlays,
        });
        console.info(`Inserted ${inserted.count} track plays (${candidatePlays.length - inserted.count} already stored).`);
        return { inserted: inserted.count, skipped: candidatePlays.length - inserted.count };
      })
        .catch((err: unknown) => {
          console.error(`Error upserting data for user ${username}:`, err);
          return { error: err instanceof Error ? err.message : String(err) };
        });
      if ("error" in counts) {
        await logFetch(dbUser.id, "write-failed", 0, 0, counts.error);
      }
      else {
        await logFetch(dbUser.id, "ok", counts.inserted, counts.skipped);
      }
    }

    // The log only needs to cover recent history
    await prisma.trackPlayFetch.deleteMany({
      where: { runAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
  } finally {
    console.info("Disconnecting Prisma.");
    await prisma.$disconnect();
  }

  return;
}

/** GET with one retry after Spotify's Retry-After on 429 */
async function fetchWithRetry(url: string, token: string): Promise<Response> {
  let response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 429) {
    const retryAfter = Math.min(Number(response.headers.get("Retry-After") ?? 1), 30);
    await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return response;
}

async function getTrackISRC(trackId: string, token: string): Promise<string | null> {
  const response = await fetchWithRetry(`https://api.spotify.com/v1/tracks/${trackId}`, token);
  if (!response.ok) {
    console.error(`Error fetching track ${trackId}: Status ${response.status} Response: ${await response.text()}`);
    return null;
  }
  const data = await response.json() as SpotifyApi.SingleTrackResponse;
  return data.external_ids?.isrc ?? null;
}

async function getSpotifyArtists(artistsSimple: SpotifyApi.ArtistObjectSimplified[], token: string): Promise<SpotifyApi.ArtistObjectFull[]> {
  const artistDetails: SpotifyApi.ArtistObjectFull[] = [];

  for (const artist of artistsSimple) {
    const response = await fetchWithRetry(artist.href, token);

    if (!response.ok) {
      console.error(`Error fetching artist details for ${artist.name}: Status ${response.status}`);
      console.error(`Response: ${await response.text()}`);
      continue;
    }

    const data = await response.json() as SpotifyApi.SingleArtistResponse;
    artistDetails.push(data);
  }

  return artistDetails;
}

async function getRecentlyPlayedTracks(token: string, username: string): Promise<UsersRecentlyPlayedTracksResponse | null> {
  const recentlyPlayedTracksResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!recentlyPlayedTracksResponse.ok) {
    console.error(`Error for user ${username}: Status ${recentlyPlayedTracksResponse.status} Response: ${await recentlyPlayedTracksResponse.text()}`);
    return null;
  }
  const recentlyPlayedTracks = await recentlyPlayedTracksResponse.json() as UsersRecentlyPlayedTracksResponse;
  // Filter out local tracks; an empty list is a valid result, not an error
  recentlyPlayedTracks.items = (recentlyPlayedTracks.items ?? []).filter((item) => !item.track.is_local);

  return recentlyPlayedTracks;
}