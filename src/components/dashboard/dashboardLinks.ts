import {
  LuChartPie,
  LuHouse,
  LuReceipt,
  LuTarget,
  LuUser,
} from "react-icons/lu";

/** The dashboard pages, shared by the sidebar (desktop) and bottom bar. */
export const DASHBOARD_LINKS = [
  { to: "/dashboard", key: "dashboard.nav.overview", icon: LuHouse, end: true },
  {
    to: "/dashboard/spending",
    key: "dashboard.nav.spending",
    icon: LuChartPie,
    end: false,
  },
  {
    to: "/dashboard/transactions",
    key: "dashboard.nav.transactions",
    icon: LuReceipt,
    end: false,
  },
  {
    to: "/dashboard/goals",
    key: "dashboard.nav.goals",
    icon: LuTarget,
    end: false,
  },
  {
    to: "/dashboard/profile",
    key: "dashboard.nav.profile",
    icon: LuUser,
    end: false,
  },
] as const;
