import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useFilters, useProfile, useTransactions } from "../../api/queries";
import { useSession } from "../../auth/AuthContext";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Pagination } from "../../components/dashboard/Pagination";
import {
  Panel,
  QueryContent,
  Skeleton,
} from "../../components/dashboard/Panel";
import { TransactionsTable } from "../../components/dashboard/TransactionsTable";
import { TransactionFiltersBar } from "../../components/transactions/TransactionFiltersBar";
import {
  PAGE_SIZE_OPTIONS,
  pageCount,
  readTransactionsView,
  toTransactionFilters,
  writeTransactionsView,
  type PageSize,
  type TransactionsView,
} from "../../lib/transactionFilters";

/** Full transaction history: /transactions with its filters and paging. */
export function TransactionsPage() {
  const { t } = useTranslation();
  const { customerId } = useSession();
  const listRef = useRef<HTMLElement>(null);

  // The view lives in the URL, so a filtered page can be shared or bookmarked.
  const [params, setParams] = useSearchParams();
  const view = readTransactionsView(params);
  const update = (next: Partial<TransactionsView>) =>
    setParams(writeTransactionsView({ ...view, ...next }), { replace: true });
  // Any filter change starts again from the first page.
  const filter = (next: Partial<TransactionsView>) =>
    update({ ...next, page: 1 });

  const filterOptions = useFilters(customerId);
  const profile = useProfile(customerId);
  const categories = filterOptions.data?.categories ?? [];
  // A category from a hand-edited URL that the API doesn't know is ignored
  // (the API would reject it), so wait for the list before using one.
  const category =
    view.category && categories.some((c) => c.name === view.category)
      ? view.category
      : undefined;
  const transactions = useTransactions(
    customerId,
    toTransactionFilters({ ...view, category }),
    { enabled: !view.category || filterOptions.isFetched },
  );

  // A page past the end (e.g. after filtering) moves to the last page.
  const total = transactions.data?.pagination.total ?? 0;
  const pages = pageCount(total, view.pageSize);
  useEffect(() => {
    if (transactions.isSuccess && !transactions.isPlaceholderData) {
      if (view.page > pages) {
        setParams(writeTransactionsView({ ...view, page: pages }), {
          replace: true,
        });
      }
    }
  });

  const goToPage = (page: number) => {
    update({ page });
    // Back to the top of the list (scrollIntoView is missing in some test DOMs).
    listRef.current?.scrollIntoView?.({ block: "start" });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("transactions.title")}
        subtitle={t("transactions.subtitle")}
      />

      <TransactionFiltersBar
        categories={categories}
        category={category}
        dates={view.dates}
        sortBy={view.sortBy}
        onCategoryChange={(next) => filter({ category: next })}
        onDatesChange={(dates) => filter({ dates })}
        onSortChange={(sortBy) => filter({ sortBy })}
        onClear={() => filter({ category: undefined, dates: undefined })}
      />

      <Panel
        ref={listRef}
        title={t("transactions.listTitle")}
        className="scroll-mt-24"
      >
        <QueryContent
          query={transactions}
          loading={
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, row) => (
                <Skeleton key={row} className="h-9 w-full" />
              ))}
            </div>
          }
          isEmpty={(data) => data.pagination.total === 0}
          emptyMessage={
            category || view.dates
              ? t("transactions.noMatches")
              : t("transactions.empty")
          }
        >
          {(data) => (
            <>
              <TransactionsTable
                transactions={data.transactions}
                currency={profile.data?.currency}
                dimmed={transactions.isPlaceholderData}
              />
              <Pagination
                page={Math.min(view.page, pages)}
                pageCount={pages}
                total={data.pagination.total}
                shown={data.transactions.length}
                pageSize={view.pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={goToPage}
                onPageSizeChange={(size) =>
                  filter({ pageSize: size as PageSize })
                }
              />
            </>
          )}
        </QueryContent>
      </Panel>
    </div>
  );
}
