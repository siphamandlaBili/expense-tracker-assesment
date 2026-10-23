import { useTranslation } from "react-i18next";
import { useProfile } from "../../api/queries";
import { useSession } from "../../auth/AuthContext";
import { DetailList } from "../../components/dashboard/DetailList";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { UserAvatar } from "../../components/dashboard/UserAvatar";
import {
  Panel,
  QueryContent,
  Skeleton,
} from "../../components/dashboard/Panel";
import {
  formatCurrency,
  formatCurrencyName,
  formatDayLong,
} from "../../lib/format";
import { useAccountTypeLabel } from "../../lib/useAccountTypeLabel";

/**
 * The customer's details, from /profile (read-only: there's no update
 * endpoint). One card, one request, each field shown once.
 */
export function ProfilePage() {
  const { t } = useTranslation();
  const { customerId } = useSession();
  const profile = useProfile(customerId);
  const accountTypeLabel = useAccountTypeLabel();

  return (
    <div className="space-y-5">
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <Panel title={t("profile.details.title")}>
        <QueryContent
          query={profile}
          loading={
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-6 w-full" />
              ))}
            </div>
          }
        >
          {(data) => (
            <>
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar size="lg" />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-heading">
                      {data.name}
                    </p>
                    <p className="text-sm break-all text-body">{data.email}</p>
                    <p className="text-sm text-body">
                      {accountTypeLabel(data.accountType)}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-body">
                    {t("profile.details.totalSpent")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-heading">
                    {formatCurrency(data.totalSpent, data.currency)}
                  </p>
                </div>
              </div>

              <DetailList
                className="mt-5 border-t border-slate-100"
                items={[
                  {
                    label: t("profile.details.customerId"),
                    value: data.customerId,
                  },
                  {
                    label: t("profile.details.joinDate"),
                    value: formatDayLong(data.joinDate),
                  },
                  {
                    label: t("profile.details.currency"),
                    value: formatCurrencyName(data.currency),
                  },
                ]}
              />
            </>
          )}
        </QueryContent>
      </Panel>
    </div>
  );
}
