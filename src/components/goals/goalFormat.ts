import type { Goal } from "../../api/schemas";
import { formatPercent } from "../../lib/format";

/** "62%" (drops a trailing ".0"). */
export const goalPercent = (goal: Goal) =>
  formatPercent(goal.percentageUsed).replace(/\.0%$/, "%");
