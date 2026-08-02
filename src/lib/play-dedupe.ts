/**
 * Takeout history and the backend's recently-played job record the same play
 * with timestamps a few seconds apart, so the exact match on the
 * (trackId, playedAt, userId) primary key can't catch those duplicates.
 * Kept in sync with Riksdagen-Backend/src/web/play-dedupe.ts.
 */
export const PLAY_DEDUPE_TOLERANCE_MS = 10_000;

type Play = { trackId: string; playedAt: Date };

/** Drop candidate plays that already exist within `toleranceMs` of a stored play of the same track. */
export function filterNearDuplicatePlays<T extends Play>(
  candidates: T[],
  existing: Play[],
  toleranceMs: number = PLAY_DEDUPE_TOLERANCE_MS,
): T[] {
  return candidates.filter((candidate) => !existing.some((play) =>
    play.trackId === candidate.trackId
    && Math.abs(play.playedAt.getTime() - candidate.playedAt.getTime()) <= toleranceMs,
  ));
}
