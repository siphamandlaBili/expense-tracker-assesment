import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  LuChartPie,
  LuHouse,
  LuLogOut,
  LuReceipt,
  LuTarget,
  LuUser,
  LuX,
} from "react-icons/lu";
import { NavLink } from "react-router";
import logo from "../../assets/logo.webp";

const DASHBOARD_LINKS = [
  { to: "/dashboard", key: "dashboard.nav.overview", icon: LuHouse, end: true },
  {
    to: "/dashboard/spending",
    key: "dashboard.nav.spending",
    icon: LuChartPie,
  },
  {
    to: "/dashboard/transactions",
    key: "dashboard.nav.transactions",
    icon: LuReceipt,
  },
  { to: "/dashboard/goals", key: "dashboard.nav.goals", icon: LuTarget },
  { to: "/dashboard/profile", key: "dashboard.nav.profile", icon: LuUser },
] as const;

type SidebarContentProps = {
  onNavigate?: () => void;
  onSignOut: () => void;
};

function SidebarContent({ onNavigate, onSignOut }: SidebarContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col px-4 py-6">
      <img
        src={logo}
        width={525}
        height={96}
        alt={t("brand.logoAlt")}
        className="mb-8 h-7 w-auto self-start px-2"
      />

      <nav aria-label={t("dashboard.nav.label")} className="flex-1">
        <ul className="space-y-1">
          {DASHBOARD_LINKS.map(({ to, key, icon: Icon, ...link }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={"end" in link}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-heading/80 hover:bg-dashboard hover:text-primary"
                  }`
                }
              >
                <Icon className="size-5" aria-hidden />
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-heading/80 transition-colors hover:bg-dashboard hover:text-primary"
      >
        <LuLogOut className="size-5" aria-hidden />
        {t("dashboard.nav.signOut")}
      </button>
    </div>
  );
}

type SidebarProps = {
  /** The mobile drawer is in the DOM (including while it slides out). */
  mobileOpen: boolean;
  /** The mobile drawer is playing its exit animation. */
  mobileClosing: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
};

export function Sidebar({
  mobileOpen,
  mobileClosing,
  onCloseMobile,
  onSignOut,
}: SidebarProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop: always visible. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white lg:block">
        <SidebarContent onSignOut={onSignOut} />
      </aside>

      {/* Mobile: a drawer that slides in from the left, only in the DOM
          while open or sliding out. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden
            className={`absolute inset-0 bg-heading/40 motion-reduce:animate-none ${mobileClosing ? "animate-fade-out" : "animate-fade-in"}`}
            onClick={onCloseMobile}
          />
          <aside
            id="dashboard-drawer"
            className={`relative h-full w-72 max-w-[85%] bg-white shadow-xl motion-reduce:animate-none ${mobileClosing ? "animate-nav-out" : "animate-nav-in"}`}
          >
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={t("dashboard.nav.closeMenu")}
              className="absolute top-5 right-3 rounded-full p-2 text-body hover:bg-dashboard hover:text-primary"
            >
              <LuX className="size-5" aria-hidden />
            </button>
            <SidebarContent onNavigate={onCloseMobile} onSignOut={onSignOut} />
          </aside>
        </div>
      )}
    </>
  );
}
