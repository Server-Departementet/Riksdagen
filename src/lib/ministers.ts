import ministersDB from "@/../ministers.json" with { type: "json" };
import type { Minister } from "@/types/types";

/** The people currently holding a minister post, lowercased for matching against free text. */
const ministerNames: ReadonlySet<string> = new Set(
  Object.values(ministersDB as Record<string, Minister>)
    .map(minister => minister.holder.trim().toLowerCase()),
);

/** Whether a name (as written in a quote's `quotee` or `sender`) belongs to a sitting minister. */
export function isMinisterName(name: string): boolean {
  return ministerNames.has(name.trim().toLowerCase());
}
