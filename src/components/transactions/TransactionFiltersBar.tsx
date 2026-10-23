import { useTranslation } from "react-i18next";
import {
  SORT_OPTIONS,
  type CategoryMeta,
  type SortBy,
} from "../../api/schemas";
import type { DateRange } from "../../lib/dateRange";
import { DateRangeFields } from "../dashboard/DateRangeFields";
import { Select } from "../dashboard/Select";

type TransactionFiltersBarProps = {
  /** Categories from /filters. */
  categories: CategoryMeta[];
  category?: string;
  dates?: DateRange;
  sortBy: SortBy;
  onCategoryChange: (category: string | undefined) => void;
  onDatesChange: (dates: DateRange | undefined) => void;
  onSortChange: (sortBy: SortBy) => void;
  onClear: () => void;
};

/** The /transactions filters: category, date range and sort order. */
export function TransactionFiltersBar({
  categories,
  category,
  dates,
  sortBy,
  onCategoryChange,
  onDatesChange,
  onSortChange,
  onClear,
}: TransactionFiltersBarProps) {
  const { t } = useTranslation();
  const filtered = Boolean(category || dates);

  return (
    <div
      role="group"
      aria-label={t("transactions.filters.label")}
      className="flex flex-wrap items-end gap-3"
    >
      <Select
        label={t("transactions.filters.category")}
        value={category ?? ""}
        options={[
          { value: "", label: t("transactions.filters.allCategories") },
          ...categories.map(({ name }) => ({ value: name, label: name })),
        ]}
        onChange={(next) => onCategoryChange(next || undefined)}
      />

      <div>
        <span className="mb-1 block text-xs font-medium text-body" aria-hidden>
          {t("transactions.filters.dates")}
        </span>
        <DateRangeFields
          align="left"
          label={t("transactions.filters.dates")}
          dates={dates}
          active={Boolean(dates)}
          onApply={onDatesChange}
        />
      </div>

      <Select
        label={t("transactions.filters.sort")}
        value={sortBy}
        options={SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`transactions.sort.${option}`),
        }))}
        onChange={onSortChange}
      />

      {filtered && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light"
        >
          {t("transactions.filters.clear")}
        </button>
      )}
    </div>
  );
}
