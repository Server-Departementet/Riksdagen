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

export function FilterPanel({
  quotees,
  selectedQuotees: initialSelectedQuotees,
  query: initialQuery,
  sortValue: initialSortValue,
  sortDirection: initialSortDirection,
}: {
  quotees: { quotee: string; count: number; }[];
  selectedQuotees: string[];
  query?: string;
  sortValue: QuoteSortValue;
  sortDirection: QuoteSortDirection;
}) {
  const [selectedQuotees, setSelectedQuotees] = useState(initialSelectedQuotees);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [sortOption, setSortOption] = useState<QuoteSortValue>(initialSortValue);
  const [sortDirection, setSortDirection] = useState<QuoteSortDirection>(initialSortDirection);

  const allSelected = quotees.length > 0 && selectedQuotees.length === quotees.length;

  return (
    <form
      className={`
        flex flex-col justify-center
        gap-y-4
      `}
      action={() => {
        // Reload with the current filters as query params
        const params = new URLSearchParams();

        // Selecting everyone is the same as no filter at all
        if (!allSelected) {
          for (const quotee of selectedQuotees) {
            params.append("quotee", quotee);
          }
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
      {/* Quotee filter */}
      <div className="w-fit">
        <div className="flex items-baseline justify-between gap-x-4">
          <h4>Citerade</h4>

          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => setSelectedQuotees(
              allSelected ? [] : quotees.map(q => q.quotee),
            )}
          >
            {allSelected ? "Rensa" : "Välj alla"}
          </Button>
        </div>

        <div className="flex flex-col max-h-64 overflow-y-auto pe-2">
          {quotees.map(({ quotee, count }) =>
            <label
              key={"filter-" + quotee}
              className="flex justify-between items-center gap-x-2 w-full"
            >
              <span>
                {quotee}
                <span className="opacity-60">&nbsp;({count})</span>
              </span>

              <Checkbox
                checked={selectedQuotees.includes(quotee)}
                onCheckedChange={(checked) => {
                  setSelectedQuotees(prev => checked === true
                    ? [...prev, quotee]
                    : prev.filter(q => q !== quotee),
                  );
                }}
              />
            </label>,
          )}

          {quotees.length === 0 && (
            <span className="opacity-60">Inga träffar</span>
          )}
        </div>
      </div>

      <div>
        <label>
          <h4>Sök</h4>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Sök citat, citerad eller inskickare"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Sortering</h4>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={value => setSortOption(value as QuoteSortValue)}>
            <SelectTrigger className="flex-1">
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
            className="h-10 w-10 p-0"
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
