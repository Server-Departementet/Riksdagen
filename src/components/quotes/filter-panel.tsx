"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import type {
  QuoteSortDirection,
  QuoteSortValue } from "@/lib/quote-sort";
import {
  DEFAULT_QUOTE_SORT_DIRECTION,
  DEFAULT_QUOTE_SORT_VALUE,
  QUOTE_SORT_OPTIONS,
} from "@/lib/quote-sort";

import type { QuoteFacet } from "@/lib/quote-facets";
import { encodeFacetSelection } from "@/lib/quote-facets";

export function FilterPanel({
  quotees,
  senders,
  selectedQuotees: initialSelectedQuotees,
  selectedSenders: initialSelectedSenders,
  query: initialQuery,
  sortValue: initialSortValue,
  sortDirection: initialSortDirection,
}: {
  quotees: QuoteFacet[];
  senders: QuoteFacet[];
  selectedQuotees: string[];
  selectedSenders: string[];
  query?: string;
  sortValue: QuoteSortValue;
  sortDirection: QuoteSortDirection;
}) {
  const [selectedQuotees, setSelectedQuotees] = useState(initialSelectedQuotees);
  const [selectedSenders, setSelectedSenders] = useState(initialSelectedSenders);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [sortOption, setSortOption] = useState<QuoteSortValue>(initialSortValue);
  const [sortDirection, setSortDirection] = useState<QuoteSortDirection>(initialSortDirection);

  return (
    <form
      className={`
        w-full
        flex flex-col justify-center
        gap-y-4
      `}
      action={() => {
        // Reload with the current filters as query params
        const params = new URLSearchParams();

        // Always written out: an absent param means "first visit", which
        // pre-selects the ministers rather than everyone
        for (const quotee of encodeFacetSelection(selectedQuotees, quotees.length)) {
          params.append("quotee", quotee);
        }

        for (const sender of encodeFacetSelection(selectedSenders, senders.length)) {
          params.append("sender", sender);
        }

        if (searchQuery.trim() !== "") {
          params.append("q", searchQuery.trim());
        }

        if (sortOption !== DEFAULT_QUOTE_SORT_VALUE) {
          params.append("sort", sortOption);
        }

        if (sortDirection !== DEFAULT_QUOTE_SORT_DIRECTION) {
          params.append("dir", sortDirection);
        }

        window.location.search = params.toString();
      }}
    >
      <FacetFilter
        title="Citerade"
        facets={quotees}
        selected={selectedQuotees}
        setSelected={setSelectedQuotees}
      />

      <FacetFilter
        title="Skriven av"
        facets={senders}
        selected={selectedSenders}
        setSelected={setSelectedSenders}
      />

      <div>
        <label>
          <h4>Sök</h4>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Sök citat, citerad eller skriven av"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Sortering</h4>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={value => setSortOption(value as QuoteSortValue)}>
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            aria-label={sortDirection === "desc" ? "Fallande ordning" : "Stigande ordning"}
            aria-pressed={sortDirection === "asc"}
            onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
            className="size-10 shrink-0 p-0"
          >
            {sortDirection === "asc"
              ? <ArrowDownNarrowWide className="size-5" />
              : <ArrowDownWideNarrow className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Refresh button */}
      <Button
        type="submit"
        variant={"outline"}
        className="hover:bg-gray-800 hover:text-white"
      >
        Uppdatera
      </Button>
    </form>
  );
}

/** A scrollable checkbox list for one filterable field, with a select all/none shortcut. */
function FacetFilter({
  title,
  facets,
  selected,
  setSelected,
}: {
  title: string;
  facets: QuoteFacet[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const allSelected = facets.length > 0 && selected.length === facets.length;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-x-4">
        <h4>{title}</h4>

        <Button
          type="button"
          variant="link"
          className="h-auto shrink-0 p-0 text-xs"
          onClick={() => setSelected(allSelected ? [] : facets.map(f => f.value))}
        >
          {allSelected ? "Rensa" : "Välj alla"}
        </Button>
      </div>

      {/* The stable gutter keeps the width identical whether or not the list scrolls */}
      <div className="flex flex-col max-h-48 overflow-y-auto pe-2 scrollbar-gutter-stable">
        {facets.map(({ value, count }) =>
          <label
            key={`filter-${title}-${value}`}
            className="flex justify-between items-center gap-x-2 w-full"
          >
            <span className="min-w-0 truncate" title={value}>
              {value}
            </span>

            <span className="flex items-center gap-x-2 shrink-0">
              <span className="opacity-60">({count})</span>

              <Checkbox
                checked={selected.includes(value)}
                onCheckedChange={(checked) => {
                  setSelected(prev => checked === true
                    ? [...prev, value]
                    : prev.filter(v => v !== value),
                  );
                }}
              />
            </span>
          </label>,
        )}

        {facets.length === 0 && (
          <span className="opacity-60">Inga träffar</span>
        )}
      </div>
    </div>
  );
}
