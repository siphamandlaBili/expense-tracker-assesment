import { useTranslation } from "react-i18next";
import { LuLogOut } from "react-icons/lu";
import { NavLink } from "react-router";
import logo from "../../assets/logo.webp";
import { DASHBOARD_LINKS } from "./dashboardLinks";

/** Navigation from md (tablets) up; phones get BottomNav instead. */
export function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslation();

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white">
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
            {DASHBOARD_LINKS.map(({ to, key, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
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
    </aside>
  );
}
