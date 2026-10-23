import { useTranslation } from "react-i18next";
import { LuIdCard } from "react-icons/lu";
import {
  useProfile,
  useSpendingByCategory,
  useSpendingSummary,
  useSpendingTrends,
  useTransactions,
} from "../../api/queries";
import { useSession } from "../../auth/AuthContext";
import { CategoryBreakdownCard } from "../../components/dashboard/CategoryBreakdownCard";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Skeleton } from "../../components/dashboard/Panel";
import { RecentTransactionsCard } from "../../components/dashboard/RecentTransactionsCard";
import { SpendingTrendCard } from "../../components/dashboard/SpendingTrendCard";
import { StatCards } from "../../components/dashboard/StatCards";
import { firstName } from "../../lib/format";
import { useAccountTypeLabel } from "../../lib/useAccountTypeLabel";

// The overview is a summary: a short trend. Longer ranges belong on Spending.
const TREND_MONTHS = 3;

const RECENT_TRANSACTIONS = {
  limit: 4,
  offset: 0,
  sortBy: "date_desc",
} as const;

function greetingKey(hour: number) {
  if (hour < 12) return "dashboard.greeting.morning" as const;
  if (hour < 18) return "dashboard.greeting.afternoon" as const;
  return "dashboard.greeting.evening" as const;
}

export function OverviewPage() {
  const { t } = useTranslation();
  const { customerId, name } = useSession();
  const accountTypeLabel = useAccountTypeLabel();

  const profile = useProfile(customerId);
  const summary = useSpendingSummary(customerId, "30d");
  const trends = useSpendingTrends(customerId, TREND_MONTHS);
  const categories = useSpendingByCategory(customerId, { period: "30d" });
  const recent = useTransactions(customerId, RECENT_TRANSACTIONS);

  const currency = profile.data?.currency;
  const accountType = profile.data?.accountType;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(greetingKey(new Date().getHours()), {
          name: firstName(profile.data?.name ?? name),
        })}
        subtitle={t("dashboard.greeting.subtitle")}
        aside={
          !profile.isError && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-light text-primary">
                <LuIdCard className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-body">
                  {t("dashboard.accountType.label")}
                </p>
                {accountType ? (
                  <p className="font-medium text-heading">
                    {accountTypeLabel(accountType)}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-4 w-32" />
                )}
              </div>
            </div>
          )
        }
      />

      <section aria-label={t("dashboard.stats.heading")}>
        <StatCards query={summary} currency={currency} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SpendingTrendCard
          query={trends}
          action={
            <span className="text-sm text-body">
              {t("dashboard.trend.months3")}
            </span>
          }
        />
        <CategoryBreakdownCard query={categories} currency={currency} />
      </div>

      <RecentTransactionsCard
        query={recent}
        currency={currency}
        count={RECENT_TRANSACTIONS.limit}
      />
    </div>
  );
}
