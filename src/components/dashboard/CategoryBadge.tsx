import { categoryColor, renderCategoryIcon } from "./categoryVisuals";

type CategoryBadgeProps = {
  /** Category name; picks the colour when `tinted`. */
  category: string;
  /** Icon name from the API (e.g. "shopping-cart"). */
  icon: string;
  size?: "sm" | "md";
  /**
   * Use the category's chart colour. Only where the colour carries meaning,
   * i.e. a chart legend linking the row to its slice; elsewhere the label
   * already names the category and colour is just noise.
   */
  tinted?: boolean;
};

/** The category's API icon in a circle. Decorative. */
export function CategoryBadge({
  category,
  icon,
  size = "md",
  tinted = false,
}: CategoryBadgeProps) {
  const color = categoryColor(category);

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full ${size === "sm" ? "size-6" : "size-7"} ${tinted ? "" : "bg-slate-100 text-body"}`}
      style={tinted ? { backgroundColor: `${color}1f`, color } : undefined}
    >
      {/* No icon name yet (e.g. /filters still loading): an empty circle,
          not a misleading fallback icon. */}
      {icon && renderCategoryIcon(icon, size === "sm" ? "size-3.5" : "size-4")}
    </span>
  );
}
