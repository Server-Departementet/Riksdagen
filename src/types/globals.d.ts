// Bare identifiers replaced at compile time by next.config.ts (compiler.define);
// the types come from the values declared there, so the two cannot drift
import type { Defines } from "../../next.config";

declare global {
  const PACKAGE_CONTRIBUTORS: Defines["PACKAGE_CONTRIBUTORS"];
  const COPYRIGHT_YEAR: Defines["COPYRIGHT_YEAR"];
}
