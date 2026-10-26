import { useTranslation } from "react-i18next";
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
import { RecentTransactionsCard } from "../../components/dashboard/RecentTransactionsCard";
import { SpendingTrendCard } from "../../components/dashboard/SpendingTrendCard";
import { StatCards } from "../../components/dashboard/StatCards";
import { firstName } from "../../lib/format";

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

  // The profile gives the currency for every amount and the greeting name.
  const profile = useProfile(customerId);
  const summary = useSpendingSummary(customerId, "30d");
  const trends = useSpendingTrends(customerId, TREND_MONTHS);
  const categories = useSpendingByCategory(customerId, { period: "30d" });
  const recent = useTransactions(customerId, RECENT_TRANSACTIONS);

  const currency = profile.data?.currency;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(greetingKey(new Date().getHours()), {
          name: firstName(profile.data?.name ?? name),
        })}
        subtitle={t("dashboard.greeting.subtitle")}
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
