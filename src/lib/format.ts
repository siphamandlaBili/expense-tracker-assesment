// Display formatting for money, percentages and dates. ZAR is written the way
// South African banking apps show it in English: R16,842.50.

const twoDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const wholeNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number, currency = "ZAR") {
  if (currency !== "ZAR") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }
  const sign = amount < 0 ? "-" : "";
  return `${sign}R${twoDecimals.format(Math.abs(amount))}`;
}

/** Axis labels: whole units, no decimals (R12,000, $12,000). */
export function formatAxisCurrency(amount: number, currency = "ZAR") {
  if (currency !== "ZAR") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `R${wholeNumber.format(amount)}`;
}

/** The symbol shown before amounts: R for rand, otherwise $, € and so on. */
export function currencySymbol(currency = "ZAR") {
  if (currency === "ZAR") return "R";
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

export function formatCount(value: number) {
  return wholeNumber.format(value);
}

/** A change in percent, always signed: +12.4%, -3.2%, 0.0%. */
export function formatChange(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

/** "14 Oct 2025", in the viewer's timezone. */
/**
 * "14 Oct 2025": day-month-year order with US month abbreviations, so
 * September is "Sep" everywhere (en-GB writes "Sept").
 */
function dayMonthYear(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`;
}

/** "14 Oct 2025", in the viewer's timezone. */
export function formatDate(isoDateTime: string) {
  return dayMonthYear(new Date(isoDateTime));
}

const monthFormat = (month: "short" | "long") =>
  // en-US: en-GB abbreviates September as "Sept".
  new Intl.DateTimeFormat("en-US", {
    month,
    year: month === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  });

/** "2024-05" to "May". */
export function formatMonthShort(isoMonth: string) {
  return monthFormat("short").format(new Date(`${isoMonth}-01T00:00:00Z`));
}

/** "2024-05" to "May 2024". */
export function formatMonthLong(isoMonth: string) {
  return monthFormat("long").format(new Date(`${isoMonth}-01T00:00:00Z`));
}

/** First word of a full name, for greetings. */
export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** "14 Oct 2025, 14:30", in the viewer's timezone. */
export function formatDateTime(isoDateTime: string) {
  const date = new Date(isoDateTime);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dayMonthYear(date)}, ${time}`;
}

/** "2024-10-01" to "1 Oct 2024". */
export function formatDayLong(isoDate: string) {
  return dayMonthYear(new Date(`${isoDate}T00:00:00Z`), "UTC");
}

/** "ZAR" to "South African Rand (ZAR)". */
export function formatCurrencyName(code: string) {
  const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
  return name && name !== code ? `${name} (${code})` : code;
}
