import { useId } from "react";
import { useTranslation } from "react-i18next";
import { LuLogOut, LuUser } from "react-icons/lu";
import { Link } from "react-router";
import { useDropdown } from "../../lib/useDropdown";
import { UserAvatar } from "./UserAvatar";

type AccountMenuProps = {
  name: string;
  /** Shown under the name once the profile has loaded. */
  email?: string;
  onSignOut: () => void;
};

/**
 * The top-bar avatar as a button opening a small account menu: who's signed
 * in, a link to the profile, and sign out. A disclosure (button + plain
 * links), which is simpler for keyboard and screen-reader users than an ARIA
 * menu.
 */
export function AccountMenu({ name, email, onSignOut }: AccountMenuProps) {
  const { t } = useTranslation();
  const menuId = useId();
  const { open, rootRef, buttonRef, toggle, close } = useDropdown();

  const itemClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-heading transition-colors hover:bg-primary-light hover:text-primary";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={t("dashboard.topBar.account", { name })}
        aria-expanded={open}
        aria-controls={menuId}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <UserAvatar />
      </button>

      <nav
        id={menuId}
        aria-label={t("dashboard.topBar.accountMenu")}
        hidden={!open}
        className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200/80 bg-white p-1 shadow-xl motion-safe:animate-menu-in"
      >
        <div className="border-b border-slate-100 px-3 pt-2 pb-3">
          <p className="truncate font-semibold text-heading">{name}</p>
          {email && <p className="truncate text-xs text-body">{email}</p>}
        </div>
        <ul className="pt-1">
          <li>
            <Link to="/dashboard/profile" onClick={close} className={itemClass}>
              <LuUser className="size-4" aria-hidden />
              {t("dashboard.nav.profile")}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                close();
                onSignOut();
              }}
              className={itemClass}
            >
              <LuLogOut className="size-4" aria-hidden />
              {t("dashboard.nav.signOut")}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
