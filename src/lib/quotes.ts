import "server-only";
import type { Quote } from "@/app/citat/types";
import type { Quote as QuoteRow } from "@/lib/prisma-bot/generated/client";
import { botPrisma } from "@/lib/prisma-bot";

/** Read the canonical quotes from the Riksdagen-Bot database (over LAN), newest first. */
export async function getQuotes(): Promise<Quote[]> {
  const rows = await botPrisma.quote.findMany({ orderBy: { createdTimestamp: "desc" } });
  return rows.map(fromQuoteRow);
}

function fromQuoteRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    authorId: row.authorId,
    createdTimestamp: Number(row.createdTimestamp),
    link: row.link,
    originalLink: row.originalLink ?? undefined,
    sender: row.sender,
    body: row.body,
    quotee: row.quotee,
    quoteeId: row.quoteeId ?? undefined,
    context: row.context ?? undefined,
    attachments: (row.attachments as string[] | null) ?? undefined,
  };
}
