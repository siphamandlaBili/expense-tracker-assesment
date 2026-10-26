import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { DASHBOARD_LINKS } from "./dashboardLinks";

/**
 * Phones (below md): the dashboard pages as a bar fixed to the bottom of
 * the screen, clear of the home indicator. The layout pads its content so
 * nothing sits underneath, and shows the sidebar instead from md up.
 */
export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("dashboard.nav.label")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-2">
        {DASHBOARD_LINKS.map(({ to, key, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.6875rem] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-body hover:text-primary"
                }`
              }
            >
              <Icon className="size-6" aria-hidden />
              {t(key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
