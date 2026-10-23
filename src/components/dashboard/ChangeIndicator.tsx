import { useTranslation } from "react-i18next";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { formatChange } from "../../lib/format";

/**
 * Percentage change. For spending, going up is bad news, so increases are red
 * and decreases green. The arrow and a screen-reader word carry the direction,
 * so it's never conveyed by colour alone.
 */
export function ChangeIndicator({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const { t } = useTranslation();

  if (value === 0) {
    return <span className={className}>{t("dashboard.stats.noChange")}</span>;
  }
  const up = value > 0;
  const Icon = up ? LuArrowUp : LuArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-red-600" : "text-green-700"} ${className}`}
    >
      <Icon className="size-[1em]" aria-hidden />
      <span className="sr-only">
        {up ? t("dashboard.stats.increase") : t("dashboard.stats.decrease")}
      </span>
      {formatChange(Math.abs(value)).replace(/^[+-]/, "")}
    </span>
  );
}
