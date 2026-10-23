import { useTranslation } from "react-i18next";
import type { Period } from "../../api/schemas";

type PeriodFilterProps = {
  period: Period;
  /** Presets from /filters (dateRangePresets). */
  presets: readonly Period[];
  onChange: (period: Period) => void;
};

/** The page's period: drives /spending/summary and /spending/categories. */
export function PeriodFilter({ period, presets, onChange }: PeriodFilterProps) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("spending.periods.label")}
      className="flex flex-wrap gap-2"
    >
      {presets.map((preset) => {
        const active = preset === period;
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(preset)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-heading hover:border-primary hover:text-primary"
            }`}
          >
            {t(`spending.periods.${preset}`)}
          </button>
        );
      })}
    </div>
  );
}
