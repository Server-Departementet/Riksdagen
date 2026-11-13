/*
 * Comments and emoji reactions on flat plans: what the browser and the API
 * share. The server side lives in comments-server.ts.
 */

/**
 * The reactions a minister can give a plan: key, emoji, Swedish name. The key is
 * what is stored and sent; the database collation cannot tell emoji apart.
 */
export const REACTIONS = [
  ["up", "👍", "Tumme upp"],
  ["heart", "❤️", "Hjärta"],
  ["laugh", "😂", "Skratt"],
  ["think", "🤔", "Fundersam"],
  ["down", "👎", "Tumme ned"],
] as const;
export type ReactionKey = typeof REACTIONS[number][0];
export const isReactionKey = (value: unknown): value is ReactionKey => REACTIONS.some(([key]) => key === value);

/** Counted in UTF-16 units after cleaning, the same way a textarea's maxLength counts. */
export const MAX_COMMENT_LENGTH = 500;
/** Only the newest this many comments of a plan are ever returned. */
export const MAX_COMMENTS_RETURNED = 200;
/** A minister may post this many comments per minute, over all plans. */
export const MAX_COMMENTS_PER_MINUTE = 5;
export const COMMENT_ID_REGEX = /^[1-9]\d{0,9}$/;

export type PlanCommentView = {
  id: number;
  authorId: string;
  authorName: string;
  /** "#rrggbb" from the author's Discord avatar, when known. */
  authorColor: string | null;
  /** Avatar URL, when the server has seen the author's session since it started. */
  authorAvatar: string | null;
  body: string;
  /** Milliseconds since the epoch. */
  createdAt: number;
  /** Whether the caller may delete it: their own comment, or any comment on their own plan. */
  canDelete: boolean;
};

/** Every route of the comments API answers with this, so the browser never needs a second request after a change. */
export type CommentsResponse = {
  /** Oldest first. */
  comments: PlanCommentView[];
  /** One entry per reaction in REACTIONS, in that order, also when nobody picked it. */
  reactions: { key: ReactionKey; count: number; names: string[] }[];
  /** The caller's own reaction. */
  mine: ReactionKey | null;
  /** The server's clock when it answered, in milliseconds: what "5 min sedan" is counted from. */
  now: number;
};

/**
 * A comment body as it is stored: plain text with line breaks, no other control
 * characters, no runs of blank lines. Null when nothing is left or it is too long.
 */
export function cleanCommentBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[^\P{Cc}\n]/gu, "") // every control character except the line break
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length >= 1 && text.length <= MAX_COMMENT_LENGTH ? text : null;
}
