import "server-only";
import { prisma } from "@/lib/prisma";

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

/** Rounds grouped by who said the quote; every non-minister shares one group. */
export type QuoteeStats = { name: string; isMinister: boolean; rounds: number; votes: number; correct: number };

const OTHERS_LABEL = "Övriga personer";

export type QuizStats = {
  rounds: number;
  votes: number;
  correct: number;
  firstRoundAt: string | null;
  players: PlayerStats[];
  series: { userId: string; name: string; points: PlayerPoint[] }[];
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

  const players = new Map<string, PlayerStats & { history: boolean[]; points: PlayerPoint[] }>();
  const quotees = new Map<string, QuoteeStats>();
  let votes = 0;
  let correct = 0;

  for (const round of rounds) {
    const isMinister = round.kind === "minister";
    const group = isMinister ? round.correctAnswer ?? "?" : OTHERS_LABEL;
    const quotee = quotees.get(group) ?? { name: group, isMinister, rounds: 0, votes: 0, correct: 0 };
    quotee.rounds += 1;
    quotees.set(group, quotee);

    for (const vote of round.votes) {
      votes += 1;
      quotee.votes += 1;
      if (vote.correct) {
        correct += 1;
        quotee.correct += 1;
      }

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

  // Stable order by Discord id, so a player keeps their chart color whatever the ranking
  const allPlayers = [...players.values()].sort((a, b) => a.userId.localeCompare(b.userId));

  return {
    rounds: rounds.length,
    votes,
    correct,
    firstRoundAt: rounds[0]?.postedAt.toISOString() ?? null,
    players: allPlayers
      .map(({ history: _history, points: _points, ...stats }) => stats)
      .sort((a, b) => b.correct - a.correct || b.votes - a.votes),
    series: allPlayers
      .filter(p => p.votes >= MIN_VOTES_FOR_CHART)
      .map(p => ({ userId: p.userId, name: p.name, points: p.points })),
    // Hardest first; the non-minister group goes last
    quotees: [...quotees.values()].sort((a, b) =>
      Number(b.isMinister) - Number(a.isMinister) || a.correct / (a.votes || 1) - b.correct / (b.votes || 1)),
  };
}
