import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatCount } from "../../lib/format";
import { Select } from "./Select";

type PaginationProps = {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  /** Total items across all pages (from the API's pagination.total). */
  total: number;
  /** Items on the current page. */
  shown: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

/** "Showing 21–40 of 1,250", rows per page, and previous/next controls. */
export function Pagination({
  page,
  pageCount,
  total,
  shown,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + shown;

  const buttonClass =
    "flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-heading transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label={t("dashboard.pagination.label")}
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-body" aria-live="polite">
        {t("dashboard.pagination.showing", {
          from: formatCount(first),
          to: formatCount(last),
          total: formatCount(total),
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Visible text; the Select carries the same label for its name. */}
          <span aria-hidden className="text-body">
            {t("dashboard.pagination.pageSize")}
          </span>
          <Select
            label={t("dashboard.pagination.pageSize")}
            hideLabel
            value={pageSize}
            options={pageSizeOptions.map((size) => ({
              value: size,
              label: String(size),
            }))}
            onChange={onPageSizeChange}
            placement="top"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t("dashboard.pagination.previous")}
            className={buttonClass}
          >
            <LuChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="whitespace-nowrap text-heading">
            {t("dashboard.pagination.page", {
              page: formatCount(page),
              count: formatCount(pageCount),
            })}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label={t("dashboard.pagination.next")}
            className={buttonClass}
          >
            <LuChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}
