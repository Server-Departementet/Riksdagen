import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
 * Raw quiz data for ministers to analyse themselves: GET /citat/stats/export?format=csv|json.
 * The proxy already hides /citat from everyone else; the check here is a second lock.
 *
 * CSV is one row per vote (a round nobody voted in still gets one row with the voter
 * columns empty), the shape spreadsheets and pandas want. JSON nests the votes in their
 * round and also carries the poll options.
 */

export const dynamic = "force-dynamic";

const CSV_COLUMNS = [
  "round", "posted_at", "closed_at", "kind", "correct_answer",
  "quote_id", "quote", "quotee", "context", "quote_sender", "quote_written_at",
  "voter_id", "voter", "answer", "correct",
] as const;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.role !== "minister") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const rounds = await getExportRounds();
  const filename = `quizstatistik-${new Date().toISOString().slice(0, 10)}.${format}`;
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };

  if (format === "json") {
    return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), rounds }, null, 2), {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const rows = rounds.flatMap(round => {
    const roundCells = [
      round.number, round.postedAt, round.closedAt, round.kind, round.correctAnswer,
      round.quoteId, round.quote?.body, round.quote?.quotee, round.quote?.context, round.quote?.sender, round.quote?.writtenAt,
    ];
    if (round.votes.length === 0) return [[...roundCells, null, null, null, null]];
    return round.votes.map(vote => [...roundCells, vote.userId, vote.name, vote.answer, vote.correct]);
  });
  // The BOM makes Excel read the file as UTF-8, so å, ä and ö survive
  const csv = "﻿" + [CSV_COLUMNS, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
  });
}

async function getExportRounds() {
  const [rounds, users] = await Promise.all([
    prisma.quizRound.findMany({ orderBy: { number: "asc" }, include: { votes: { orderBy: { userId: "asc" } } } }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);
  const quotes = await prisma.quote.findMany({ where: { id: { in: rounds.map(r => r.quoteId) } } });
  const quoteOf = new Map(quotes.map(q => [q.id, q]));
  const nameOf = new Map(users.map(u => [u.id, u.name]));

  return rounds.map(round => {
    const quote = quoteOf.get(round.quoteId); // Missing if the quote was deleted since
    return {
      number: round.number,
      postedAt: round.postedAt.toISOString(),
      closedAt: round.closedAt?.toISOString() ?? null,
      kind: round.kind,
      correctAnswer: round.correctAnswer,
      options: round.options,
      quoteId: round.quoteId,
      quote: quote
        ? {
          body: quote.body,
          quotee: quote.quotee,
          context: quote.context,
          sender: quote.sender,
          writtenAt: new Date(Number(quote.createdTimestamp)).toISOString(),
          link: quote.link,
        }
        : null,
      votes: round.votes.map(vote => ({
        userId: vote.userId,
        name: nameOf.get(vote.userId) ?? null,
        answer: vote.answer,
        correct: vote.correct,
      })),
    };
  });
}

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}
