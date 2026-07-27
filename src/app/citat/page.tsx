import { getFilteredQuotes, getQuoteeCounts } from "@/lib/quotes";
import { FilterPanel } from "@/components/quotes/filter-panel";
import { ExternalLinkIcon } from "lucide-react";
import type {
  QuoteSortDirection,
  QuoteSortValue,
} from "@/lib/quote-sort";
import {
  DEFAULT_QUOTE_SORT_DIRECTION,
  DEFAULT_QUOTE_SORT_VALUE,
  isQuoteSortValue,
} from "@/lib/quote-sort";

export const dynamic = "force-dynamic";

type FilterParams = {
  quotee?: string | string[]; // Repeated once per selected quotee
  q?: string; // Search query
  sort?: string;
  dir?: string;
};

function isMultiSpeakerQuote(content: string): boolean {
  const isMultiLine =
    content.includes("\n")
    && content.split("\n").every(line => line.trim().startsWith("\"") && line.trim().includes("-"));
  return isMultiLine;
}

export default async function QuoteStatsPage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  const {
    quotee: paramQuotees,
    q: paramQuery,
    sort: paramSort,
    dir: paramDirection,
  } = await searchParams;

  const sortValue: QuoteSortValue = isQuoteSortValue(paramSort)
    ? paramSort
    : DEFAULT_QUOTE_SORT_VALUE;
  const sortDirection: QuoteSortDirection = typeof paramDirection === "string" && paramDirection.toLowerCase() === "asc"
    ? "asc"
    : DEFAULT_QUOTE_SORT_DIRECTION;

  const searchQuery = paramQuery?.trim() ? paramQuery.trim() : undefined;

  const quoteeCounts = await getQuoteeCounts(searchQuery);
  const requestedQuotees = [paramQuotees ?? []].flat().filter(q => q.trim() !== "");
  const hasQuoteeParam = requestedQuotees.length > 0;
  // Quotees that no longer exist under the current search are dropped
  const selectedQuotees = hasQuoteeParam
    ? requestedQuotees.filter(q => quoteeCounts.some(entry => entry.quotee === q))
    : quoteeCounts.map(entry => entry.quotee);

  const quotes = hasQuoteeParam && selectedQuotees.length === 0
    ? []
    : await getFilteredQuotes({
      quotees: hasQuoteeParam ? selectedQuotees : undefined,
      searchQuery,
      sortValue,
      sortDirection,
    });

  return <main
    className={`
      flex flex-col items-center justify-center
      lg:flex-row lg:items-start

      gap-y-6
      lg:gap-x-6

      px-0
    `}
  >
    <aside className="px-4 flex flex-col gap-y-5">
      <h1 className="mt-4">Citatstatistik</h1>

      <FilterPanel
        quotees={quoteeCounts}
        selectedQuotees={selectedQuotees}
        query={searchQuery}
        sortValue={sortValue}
        sortDirection={sortDirection}
      />
    </aside>

    <hr className="lg:hidden w-11/12" />

    <section className="lg:pt-4 pb-16 w-full lg:w-auto px-4 lg:px-0">
      <p className="opacity-60">
        {quotes.length} citat
      </p>

      <ul>
        {quotes.map(q => (
          <li
            key={q.id}
            className="*:ms-3 not-first:border-t-2 py-1 flex flex-row "
          >
            <a
              href={q.link}
              className="global min-w-fit"
              target="_blank"
              rel="noreferrer"
            >
              discord&nbsp;
              <ExternalLinkIcon className="size-3 inline mb-0.5" />
            </a>
            <span className="min-w-fit">{new Date(q.createdTimestamp).toLocaleString("se")}</span>
            {isMultiSpeakerQuote(q.body)
              ? <p className="whitespace-pre-wrap">
                {q.body}
              </p>
              : <span>
                {q.body} - {q.quotee}
              </span>
            }
          </li>
        ))}
      </ul>
    </section>
  </main>;
}
