import { createElement } from "react";
import type { IconType } from "react-icons";
import {
  LuCar,
  LuCircleDollarSign,
  LuFilm,
  LuShoppingBag,
  LuShoppingCart,
  LuUtensils,
  LuZap,
} from "react-icons/lu";

// Chart colours follow the category, never its rank, so a category keeps its
// colour when the ranking or the period changes. These are the first six
// slots of a colour-blind-safe categorical palette (validated for adjacent
// pairs), used instead of the API's `color` field so charts match the app's
// visual language. Three slots are under 3:1 contrast on white, so every
// chart that uses them also labels each category in text.
const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#2a78d6",
  Transportation: "#eb6834",
  Dining: "#1baf7a",
  Shopping: "#eda100",
  Entertainment: "#e87ba4",
  Utilities: "#008300",
};

const FALLBACK_COLOR = "#8a8f9c";

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}

const ICONS: Record<string, IconType> = {
  "shopping-cart": LuShoppingCart,
  film: LuFilm,
  car: LuCar,
  utensils: LuUtensils,
  "shopping-bag": LuShoppingBag,
  zap: LuZap,
};

/** Renders the icon named by the API (e.g. "shopping-cart"), with a fallback. */
export function renderCategoryIcon(iconName: string, className: string) {
  return createElement(ICONS[iconName] ?? LuCircleDollarSign, { className });
}
