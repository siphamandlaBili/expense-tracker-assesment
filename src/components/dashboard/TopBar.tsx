import { useTranslation } from "react-i18next";
import { LuMenu } from "react-icons/lu";
import { AccountMenu } from "./AccountMenu";
import { NotificationsMenu } from "./NotificationsMenu";

type TopBarProps = {
  name: string;
  email?: string;
  onSignOut: () => void;
  menuOpen: boolean;
  onOpenMenu: () => void;
};

export function TopBar({
  name,
  email,
  onSignOut,
  menuOpen,
  onOpenMenu,
}: TopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-dashboard/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("dashboard.nav.openMenu")}
        aria-expanded={menuOpen}
        aria-controls="dashboard-drawer"
        className="rounded-md p-1 text-heading hover:text-primary lg:hidden"
      >
        <LuMenu className="size-6" aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsMenu />
        <AccountMenu name={name} email={email} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
