import { useTranslation } from "react-i18next";
import logo from "../../assets/logo.webp";
import { AccountMenu } from "./AccountMenu";
import { NotificationsMenu } from "./NotificationsMenu";

type TopBarProps = {
  name: string;
  email?: string;
  onSignOut: () => void;
};

export function TopBar({ name, email, onSignOut }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-dashboard/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      {/* The sidebar carries the logo from md up; phones show it here. */}
      <img
        src={logo}
        width={525}
        height={96}
        alt={t("brand.logoAlt")}
        className="h-6 w-auto md:hidden"
      />

      <div className="ml-auto flex items-center gap-2">
        <NotificationsMenu />
        <AccountMenu name={name} email={email} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
