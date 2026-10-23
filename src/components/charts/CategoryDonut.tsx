import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySpend } from "../../api/schemas";
import { formatCurrency, formatPercent } from "../../lib/format";
import { categoryColor } from "../dashboard/categoryVisuals";
import { CHART_HEADING, tooltipContentStyle } from "./chartTheme";

type CategoryDonutProps = {
  categories: CategorySpend[];
  /** Shown in the centre. */
  total: number;
  totalLabel: string;
  /** Accessible name for the chart image. */
  label: string;
  currency?: string;
  /** Size classes for the square chart, e.g. "size-44 @lg:size-48". */
  className?: string;
};

/**
 * Donut of spend per category with the total in the centre. Slice colours
 * follow the category (never its rank); hovering a slice shows its share.
 * Pair it with a legend or table that names each category in text.
 */
export function CategoryDonut({
  categories,
  total,
  totalLabel,
  label,
  currency,
  className = "size-44",
}: CategoryDonutProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative shrink-0 ${className}`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 176, height: 176 }}
      >
        <PieChart>
          <Pie
            data={categories}
            dataKey="amount"
            nameKey="name"
            innerRadius="64%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {categories.map((category) => (
              <Cell key={category.name} fill={categoryColor(category.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_value, name, item) => [
              formatPercent((item.payload as CategorySpend).percentage),
              String(name),
            ]}
            contentStyle={tooltipContentStyle}
            // Text stays in heading ink, not the slice colour.
            itemStyle={{ color: CHART_HEADING }}
            // Above the centre total, which is drawn after the chart.
            wrapperStyle={{ zIndex: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold text-heading @lg:text-base">
          {formatCurrency(total, currency)}
        </span>
        <span className="text-xs text-body">{totalLabel}</span>
      </div>
    </div>
  );
}
