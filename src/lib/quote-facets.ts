/** One selectable value in a side panel filter, with how many quotes carry it. */
export type QuoteFacet = {
  value: string;
  count: number;
};

/**
 * Sentinel meaning "every value is selected". Without it an explicit select-all
 * would be indistinguishable from a fresh visit, which defaults to the ministers.
 */
export const ALL_FACET_VALUES = "*";

/**
 * The values to write to the URL for one facet. An empty string is kept as a
 * marker for "nothing selected", so the key stays present in the query string.
 */
export function encodeFacetSelection(selected: string[], available: number): string[] {
  if (available > 0 && selected.length === available) {
    return [ALL_FACET_VALUES];
  }

  return selected.length > 0 ? selected : [""];
}

/**
 * Read a repeatable filter param back into a selection.
 * A missing param means "first visit", which pre-selects `isDefaultValue`
 * matches — unless none exist, in which case everything stays selected.
 */
export function decodeFacetSelection(
  param: string | string[] | undefined,
  facets: QuoteFacet[],
  isDefaultValue: (value: string) => boolean,
): { selected: string[]; isFiltered: boolean } {
  const available = facets.map(facet => facet.value);

  if (typeof param === "undefined") {
    const defaults = available.filter(isDefaultValue);
    return defaults.length > 0
      ? { selected: defaults, isFiltered: defaults.length !== available.length }
      : { selected: available, isFiltered: false };
  }

  const requested = [param].flat();
  if (requested.includes(ALL_FACET_VALUES)) {
    return { selected: available, isFiltered: false };
  }

  // Values that no longer exist under the current search are dropped
  return {
    selected: requested.filter(value => available.includes(value)),
    isFiltered: true,
  };
}
