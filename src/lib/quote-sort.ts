export const QUOTE_SORT_OPTIONS = [
  { value: "date", label: "Datum" },
  { value: "quotee", label: "Citerad" },
  { value: "sender", label: "Skriven av" },
  { value: "length", label: "Längd" },
] as const;

export type QuoteSortValue = typeof QUOTE_SORT_OPTIONS[number]["value"];
export type QuoteSortDirection = "asc" | "desc";

export const DEFAULT_QUOTE_SORT_VALUE: QuoteSortValue = "date";
export const DEFAULT_QUOTE_SORT_DIRECTION: QuoteSortDirection = "desc";

export const isQuoteSortValue = (value: string | undefined): value is QuoteSortValue =>
  typeof value === "string" && QUOTE_SORT_OPTIONS.some(option => option.value === value);
