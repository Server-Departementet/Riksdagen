import "server-only";
import { prisma } from "@/lib/prisma";
import { lineColors } from "@/lib/chart-colors";

/*
 * Citat quiz statistics for /citat/stats. The rounds and votes are copied in by the
 * Riksdagen-Bot quiz; only closed rounds (results posted) count.
 */

/** Rolling hit rate window, in rounds the player voted in. */
export const ROLLING_WINDOW = 20;
/** Players with fewer votes stay in the table but get no line in the chart. */
export const MIN_VOTES_FOR_CHART = 10;

export type PlayerStats = {
  userId: string;
  name: string;
  votes: number;
  correct: number;
  longestStreak: number;
  /** Consecutive correct answers up to the player's latest vote. */
  currentStreak: number;
};

/** One point per closed round the player voted in. */
export type PlayerPoint = {
  round: number;
  date: string; // ISO, when the round was posted
  cumulativeCorrect: number;
  /** Share of the last ROLLING_WINDOW votes that were right; null until that many exist. */
  rollingRate: number | null;
};

/** Rounds grouped by who said the quote; every non-minister shares one group, broken down in `people`. */
export type QuoteeStats = {
  name: string;
  isMinister: boolean;
  rounds: number;
  votes: number;
  correct: number;
  people?: QuoteeStats[];
};

/** Quotes coming in versus quotes used up by the quiz, per calendar month since the quiz started. */
export type FlowMonth = {
  month: string; // YYYY-MM, Stockholm time
  added: number; // New quotes the quiz can ask about
  quizzed: number; // Rounds posted
  /** Quizzable quotes not yet asked about, at the end of the month (or now, for the current one). */
  left: number;
  partial: boolean; // The current month, still running
};

export type QuoteFlow = {
  months: FlowMonth[];
  left: number;
  /** Over the last 30 days. */
  recent: { added: number; quizzed: number };
};

/*
 * Which quotes the quiz can ask about. Mirrors Riksdagen-Bot's src/quiz/quiz-selection.ts
 * (quizConfig.externalMinQuotes, excludedQuoteeKeys, roundKindFor) — keep them in sync.
 */
const EXTERNAL_MIN_QUOTES = 3;
const EXCLUDED_QUOTEE_KEYS = new Set(["okänd", "okänt", "person", "någon"]);

const OTHERS_LABEL = "Övriga personer";

export type QuizStats = {
  rounds: number;
  votes: number;
  correct: number;
  firstRoundAt: string | null;
  players: PlayerStats[];
  /** Chart colour per player in the chart, from their avatar. */
  series: { userId: string; name: string; color: string; points: PlayerPoint[] }[];
  quotees: QuoteeStats[];
};

export async function getQuizStats(): Promise<QuizStats> {
  const [rounds, users] = await Promise.all([
    prisma.quizRound.findMany({
      where: { closedAt: { not: null } },
      orderBy: { number: "asc" },
      include: { votes: true },
    }),
    prisma.user.findMany(),
  ]);
  const nameOf = new Map(users.map(u => [u.id, u.name ?? u.id]));
  const avatarColorOf = new Map(users.map(u => [u.id, u.avatarColor]));

  const players = new Map<string, PlayerStats & { history: boolean[]; points: PlayerPoint[] }>();
  const quotees = new Map<string, QuoteeStats>();
  const others = new Map<string, QuoteeStats>();
  let votes = 0;
  let correct = 0;

  for (const round of rounds) {
    const isMinister = round.kind === "minister";
    const group = isMinister ? round.correctAnswer ?? "?" : OTHERS_LABEL;
    const quotee = quotees.get(group) ?? { name: group, isMinister, rounds: 0, votes: 0, correct: 0 };
    quotees.set(group, quotee);
    // Non-ministers also count towards their own row inside the shared group
    const personName = round.correctAnswer ?? "?";
    const person = isMinister ? null : others.get(personName) ?? { name: personName, isMinister, rounds: 0, votes: 0, correct: 0 };
    if (person) others.set(personName, person);
    for (const stats of [quotee, person]) if (stats) stats.rounds += 1;

    for (const vote of round.votes) {
      votes += 1;
      for (const stats of [quotee, person]) {
        if (!stats) continue;
        stats.votes += 1;
        if (vote.correct) stats.correct += 1;
      }
      if (vote.correct) correct += 1;

      const player = players.get(vote.userId) ?? {
        userId: vote.userId,
        name: nameOf.get(vote.userId) ?? vote.userId,
        votes: 0,
        correct: 0,
        longestStreak: 0,
        currentStreak: 0,
        history: [],
        points: [],
      };
      players.set(vote.userId, player);

      player.votes += 1;
      player.history.push(vote.correct);
      if (vote.correct) {
        player.correct += 1;
        player.currentStreak += 1;
        player.longestStreak = Math.max(player.longestStreak, player.currentStreak);
      }
      else {
        player.currentStreak = 0;
      }

      const window = player.history.slice(-ROLLING_WINDOW);
      player.points.push({
        round: round.number,
        date: round.postedAt.toISOString(),
        cumulativeCorrect: player.correct,
        rollingRate: window.length === ROLLING_WINDOW ? window.filter(Boolean).length / ROLLING_WINDOW : null,
      });
    }
  }

  const hardestFirst = (a: QuoteeStats, b: QuoteeStats) => a.correct / (a.votes || 1) - b.correct / (b.votes || 1) || b.rounds - a.rounds;
  const othersGroup = quotees.get(OTHERS_LABEL);
  if (othersGroup) othersGroup.people = [...others.values()].sort(hardestFirst);

  // Stable order by Discord id, so a player without an avatar colour keeps their palette slot
  const allPlayers = [...players.values()].sort((a, b) => a.userId.localeCompare(b.userId));
  const charted = allPlayers.filter(p => p.votes >= MIN_VOTES_FOR_CHART);
  const colors = lineColors(charted.map(p => avatarColorOf.get(p.userId) ?? null));

  return {
    rounds: rounds.length,
    votes,
    correct,
    firstRoundAt: rounds[0]?.postedAt.toISOString() ?? null,
    players: allPlayers
      .map(({ history: _history, points: _points, ...stats }) => stats)
      .sort((a, b) => b.correct - a.correct || b.votes - a.votes),
    series: charted.map((p, i) => ({ userId: p.userId, name: p.name, color: colors[i] ?? "#2a78d6", points: p.points })),
    // Hardest first; the non-minister group goes last
    quotees: [...quotees.values()].sort((a, b) => Number(b.isMinister) - Number(a.isMinister) || hardestFirst(a, b)),
  };
}

const stockholmMonth = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit" });
const monthOf = (date: Date) => stockholmMonth.format(date).slice(0, 7); // "2026-01"

/** Monthly quote inflow against quiz outflow, from the month of the first round to now. */
export async function getQuoteFlow(now = new Date()): Promise<QuoteFlow> {
  const [quotes, rounds] = await Promise.all([
    prisma.quote.findMany({ select: { id: true, createdTimestamp: true, quoteeId: true, quoteeKey: true } }),
    prisma.quizRound.findMany({ select: { quoteId: true, postedAt: true }, orderBy: { postedAt: "asc" } }),
  ]);

  const keyCounts = new Map<string, number>();
  for (const q of quotes) {
    if (!q.quoteeId && q.quoteeKey) keyCounts.set(q.quoteeKey, (keyCounts.get(q.quoteeKey) ?? 0) + 1);
  }
  const quizzable = quotes.filter(q => q.quoteeId
    || (q.quoteeKey && !EXCLUDED_QUOTEE_KEYS.has(q.quoteeKey) && (keyCounts.get(q.quoteeKey) ?? 0) >= EXTERNAL_MIN_QUOTES));
  const quizzableIds = new Set(quizzable.map(q => q.id));
  const createdAt = (q: { createdTimestamp: bigint }) => new Date(Number(q.createdTimestamp));

  const firstRound = rounds[0];
  if (!firstRound) return { months: [], left: quizzable.length, recent: { added: 0, quizzed: 0 } };

  const currentMonth = monthOf(now);
  const months: string[] = [];
  for (let m = monthOf(firstRound.postedAt); m <= currentMonth; m = nextMonth(m)) months.push(m);

  const added = new Map<string, number>();
  for (const q of quizzable) {
    const m = monthOf(createdAt(q));
    added.set(m, (added.get(m) ?? 0) + 1);
  }
  const quizzed = new Map<string, number>();
  for (const r of rounds) {
    const m = monthOf(r.postedAt);
    quizzed.set(m, (quizzed.get(m) ?? 0) + 1);
  }

  // The backlog: quizzable quotes written so far minus those a round has asked about so far
  const firstMonth = months[0] ?? currentMonth;
  let left = quizzable.filter(q => monthOf(createdAt(q)) < firstMonth).length;
  const used = new Set<string>();
  const result: FlowMonth[] = months.map(month => {
    left += added.get(month) ?? 0;
    for (const r of rounds) {
      if (monthOf(r.postedAt) === month && quizzableIds.has(r.quoteId) && !used.has(r.quoteId)) {
        used.add(r.quoteId);
        left -= 1;
      }
    }
    return { month, added: added.get(month) ?? 0, quizzed: quizzed.get(month) ?? 0, left, partial: month === currentMonth };
  });

  const since = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  return {
    months: result,
    left,
    recent: {
      added: quizzable.filter(q => createdAt(q).getTime() >= since).length,
      quizzed: rounds.filter(r => r.postedAt.getTime() >= since).length,
    },
  };
}

function nextMonth(month: string): string {
  const [year = 0, m = 1] = month.split("-").map(Number);
  return m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
}
