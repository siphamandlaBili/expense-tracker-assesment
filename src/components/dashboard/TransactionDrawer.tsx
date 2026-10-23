import { useTranslation } from "react-i18next";
import type { Transaction } from "../../api/schemas";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { CategoryBadge } from "./CategoryBadge";
import { Drawer, DrawerDetails } from "./Drawer";

type TransactionDrawerProps = {
  transaction: Transaction;
  currency?: string;
  onClose: () => void;
};

/** Every field the API returns for a transaction, in a drawer. */
export function TransactionDrawer({
  transaction,
  currency,
  onClose,
}: TransactionDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={t("dashboard.transaction.title")}
      closeLabel={t("dashboard.transaction.close")}
      onClose={onClose}
      backdropTestId="transaction-drawer-backdrop"
    >
      <div className="flex flex-col items-center text-center">
        <p className="text-lg font-semibold text-heading">
          {transaction.merchant}
        </p>
        <p className="mt-1 text-3xl font-bold text-heading">
          <span className="sr-only">{t("dashboard.transaction.amount")}: </span>
          {formatCurrency(transaction.amount, currency)}
        </p>
      </div>

      <DrawerDetails
        items={[
          {
            label: t("dashboard.transaction.date"),
            value: (
              <time dateTime={transaction.date}>
                {formatDateTime(transaction.date)}
              </time>
            ),
          },
          {
            label: t("dashboard.transaction.category"),
            value: (
              <span className="flex items-center gap-2">
                <CategoryBadge
                  category={transaction.category}
                  icon={transaction.icon}
                  size="sm"
                />
                {transaction.category}
              </span>
            ),
          },
          {
            label: t("dashboard.transaction.description"),
            value: transaction.description,
          },
          {
            label: t("dashboard.transaction.paymentMethod"),
            value: transaction.paymentMethod,
          },
          {
            label: t("dashboard.transaction.reference"),
            value: <span className="font-mono text-xs">{transaction.id}</span>,
          },
        ]}
      />
    </Drawer>
  );
}
