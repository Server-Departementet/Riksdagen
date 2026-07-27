import type { QuoteFacet } from "@/lib/quotes";
import { getFilteredQuotes, getQuoteeCounts, getSenderCounts } from "@/lib/quotes";
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
  sender?: string | string[]; // Repeated once per selected sender
  q?: string; // Search query
  sort?: string;
  dir?: string;
};

/**
 * Resolve a repeatable filter param against the values that actually exist.
 * No param at all means "everything"; a param whose values have all been
 * filtered away by the search means "nothing".
 */
function resolveFacetSelection(
  param: string | string[] | undefined,
  facets: QuoteFacet[],
): { selected: string[]; isFiltered: boolean } {
  const requested = [param ?? []].flat().filter(value => value.trim() !== "");
  if (requested.length === 0) {
    return { selected: facets.map(facet => facet.value), isFiltered: false };
  }

  return {
    selected: requested.filter(value => facets.some(facet => facet.value === value)),
    isFiltered: true,
  };
}

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
    sender: paramSenders,
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

  const [quoteeCounts, senderCounts] = await Promise.all([
    getQuoteeCounts(searchQuery),
    getSenderCounts(searchQuery),
  ]);

  const {
    selected: selectedQuotees,
    isFiltered: quoteesFiltered,
  } = resolveFacetSelection(paramQuotees, quoteeCounts);
  const {
    selected: selectedSenders,
    isFiltered: sendersFiltered,
  } = resolveFacetSelection(paramSenders, senderCounts);

  const filteredToNothing =
    (quoteesFiltered && selectedQuotees.length === 0)
    || (sendersFiltered && selectedSenders.length === 0);

  const quotes = filteredToNothing
    ? []
    : await getFilteredQuotes({
      quotees: quoteesFiltered ? selectedQuotees : undefined,
      senders: sendersFiltered ? selectedSenders : undefined,
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
    <aside className="w-full max-w-sm lg:w-72 lg:max-w-none shrink-0 px-4 flex flex-col gap-y-5">
      <h1 className="mt-4">Citatstatistik</h1>

      <FilterPanel
        quotees={quoteeCounts}
        senders={senderCounts}
        selectedQuotees={selectedQuotees}
        selectedSenders={selectedSenders}
        query={searchQuery}
        sortValue={sortValue}
        sortDirection={sortDirection}
      />
    </aside>

    <hr className="lg:hidden w-11/12" />

    <section className="lg:pt-4 pb-16 w-full max-w-4xl px-4 lg:px-0">
      <p className="opacity-60">
        {quotes.length} citat
      </p>

      <ul>
        {quotes.map(q => (
          <li
            key={q.id}
            className="not-first:border-t-2 py-1 ps-3 flex flex-row gap-x-3"
          >
            <a
              href={q.link}
              className="global w-20 shrink-0"
              target="_blank"
              rel="noreferrer"
            >
              discord&nbsp;
              <ExternalLinkIcon className="size-3 inline mb-0.5" />
            </a>
            <span className="w-44 shrink-0 tabular-nums">
              {new Date(q.createdTimestamp).toLocaleString("sv-SE")}
            </span>
            <span className="w-32 shrink-0 truncate" title={q.sender}>
              {q.sender}
            </span>
            {isMultiSpeakerQuote(q.body)
              ? <p className="flex-1 min-w-0 whitespace-pre-wrap">
                {q.body}
              </p>
              : <span className="flex-1 min-w-0">
                {q.body} - {q.quotee}
              </span>
            }
          </li>
        ))}
      </ul>
    </section>
  </main>;
}
