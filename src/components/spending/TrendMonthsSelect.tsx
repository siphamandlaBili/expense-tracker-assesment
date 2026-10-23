import { useTranslation } from "react-i18next";
import {
  TREND_MONTH_OPTIONS,
  type TrendMonths,
} from "../../lib/spendingFilters";
import { Select } from "../dashboard/Select";

/** How many months /spending/trends returns (the API allows 1 to 24). */
export function TrendMonthsSelect({
  value,
  onChange,
}: {
  value: TrendMonths;
  onChange: (months: TrendMonths) => void;
}) {
  const { t } = useTranslation();

  return (
    <Select
      label={t("spending.trend.range")}
      hideLabel
      align="right"
      value={value}
      options={TREND_MONTH_OPTIONS.map((months) => ({
        value: months,
        label: t(`spending.trend.months${months}`),
      }))}
      onChange={onChange}
    />
  );
}
