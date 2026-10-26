import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisCurrency, formatCurrency } from "../../lib/format";
import {
  CHART_AXIS_TEXT,
  CHART_GRID,
  CHART_PRIMARY,
  tooltipContentStyle,
} from "./chartTheme";

export type TrendPoint = {
  /** Stable id for the point, e.g. "2024-10" or "2024-10-01". */
  key: string;
  value: number;
};

type TrendChartProps = {
  data: TrendPoint[];
  /** Accessible name for the chart image. */
  label: string;
  /** Name of the value in tooltips and the table, e.g. "Spent". */
  valueLabel: string;
  /** Header of the key column in the screen-reader table. */
  keyLabel: string;
  formatTick: (key: string) => string;
  /** Full description of a point, for tooltips and the table. */
  formatKey: (key: string) => string;
  /** Faded while newer data loads. */
  dimmed?: boolean;
  /** ISO code of the amounts (the profile currency). */
  currency?: string;
};

/** Points beyond this many get no dots: the line alone reads better. */
const MAX_DOTTED_POINTS = 12;

/**
 * Single-series spending area chart, with a hover tooltip and the same data
 * as a visually hidden table for screen readers.
 */
export function TrendChart({
  data,
  label,
  valueLabel,
  keyLabel,
  formatTick,
  formatKey,
  dimmed = false,
  currency,
}: TrendChartProps) {
  // useId output isn't a valid CSS identifier inside url(#...).
  const gradientId = `trend-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const showDots = data.length <= MAX_DOTTED_POINTS;

  return (
    <>
      <div
        role="img"
        aria-label={label}
        className={`h-60 transition-opacity ${dimmed ? "opacity-60" : ""}`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 240 }}
        >
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={CHART_PRIMARY}
                  stopOpacity={0.16}
                />
                <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis
              dataKey="key"
              tickFormatter={formatTick}
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_AXIS_TEXT, fontSize: 12 }}
              minTickGap={16}
              dy={8}
            />
            <YAxis
              tickFormatter={(value: number) =>
                formatAxisCurrency(value, currency)
              }
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_AXIS_TEXT, fontSize: 12 }}
              width={72}
            />
            <Tooltip
              cursor={{ stroke: CHART_PRIMARY, strokeDasharray: "4 4" }}
              formatter={(value) => [
                formatCurrency(Number(value), currency),
                valueLabel,
              ]}
              labelFormatter={(key) => formatKey(String(key))}
              contentStyle={tooltipContentStyle}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_PRIMARY}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={
                showDots
                  ? {
                      r: 4,
                      fill: CHART_PRIMARY,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }
                  : false
              }
              activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{keyLabel}</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.key}>
              <th scope="row">{formatKey(point.key)}</th>
              <td>{formatCurrency(point.value, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
