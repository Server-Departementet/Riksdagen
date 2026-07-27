import "server-only";
import type { Quote } from "@/app/citat/types";
import type { Prisma, Quote as QuoteRow } from "@/lib/prisma-bot/generated/client";
import { botPrisma } from "@/lib/prisma-bot";
import type { QuoteSortDirection, QuoteSortValue } from "@/lib/quote-sort";
import {
  DEFAULT_QUOTE_SORT_DIRECTION,
  DEFAULT_QUOTE_SORT_VALUE,
} from "@/lib/quote-sort";

export type QuoteFilter = {
  /** Only keep quotes attributed to one of these quotees. Omitted or empty means "all". */
  quotees?: string[];
  /** Free text matched against body, quotee, sender and context. */
  searchQuery?: string;
  sortValue?: QuoteSortValue;
  sortDirection?: QuoteSortDirection;
};

/** Read the canonical quotes from the Riksdagen-Bot database (over LAN), newest first. */
export async function getQuotes(): Promise<Quote[]> {
  const rows = await botPrisma.quote.findMany({ orderBy: { createdTimestamp: "desc" } });
  return rows.map(fromQuoteRow);
}

/** Read the canonical quotes, filtered and sorted according to the given criteria. */
export async function getFilteredQuotes({
  quotees,
  searchQuery,
  sortValue = DEFAULT_QUOTE_SORT_VALUE,
  sortDirection = DEFAULT_QUOTE_SORT_DIRECTION,
}: QuoteFilter): Promise<Quote[]> {
  const rows = await botPrisma.quote.findMany({
    where: buildQuoteWhere({ quotees, searchQuery }),
  });

  const directionMultiplier = sortDirection === "asc" ? 1 : -1;
  const collator = new Intl.Collator("sv-SE", { sensitivity: "base" });

  return rows
    .map(fromQuoteRow)
    .sort((a, b) => {
      let comparison;
      switch (sortValue) {
        case "date":
          comparison = a.createdTimestamp - b.createdTimestamp;
          break;
        case "quotee":
          comparison = collator.compare(a.quotee, b.quotee);
          break;
        case "sender":
          comparison = collator.compare(a.sender, b.sender);
          break;
        default:
          comparison = 0;
      }

      if (comparison !== 0) {
        return comparison * directionMultiplier;
      }

      // Newest first within a group, then a stable tie-breaker on the message ID
      const secondary = b.createdTimestamp - a.createdTimestamp;
      if (secondary !== 0) {
        return secondary;
      }

      return a.id.localeCompare(b.id);
    });
}

/**
 * The distinct quotees available for filtering, with how many quotes each has.
 * The search query is applied first, so the list mirrors what can actually be shown.
 */
export async function getQuoteeCounts(searchQuery?: string): Promise<{
  quotee: string;
  count: number;
}[]> {
  const groups = await botPrisma.quote.groupBy({
    by: ["quotee"],
    where: buildQuoteWhere({ searchQuery }),
    _count: { _all: true },
  });

  const collator = new Intl.Collator("sv-SE", { sensitivity: "base" });
  return groups
    .map(group => ({ quotee: group.quotee, count: group._count._all }))
    .sort((a, b) => b.count - a.count || collator.compare(a.quotee, b.quotee));
}

function buildQuoteWhere({
  quotees,
  searchQuery,
}: Pick<QuoteFilter, "quotees" | "searchQuery">): Prisma.QuoteWhereInput {
  const conditions: Prisma.QuoteWhereInput[] = [];

  const trimmedQuery = searchQuery?.trim();
  if (trimmedQuery) {
    conditions.push({
      OR: [
        { body: { contains: trimmedQuery } },
        { quotee: { contains: trimmedQuery } },
        { sender: { contains: trimmedQuery } },
        { context: { contains: trimmedQuery } },
      ],
    });
  }

  if (quotees && quotees.length > 0) {
    conditions.push({ quotee: { in: quotees } });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
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
