import { useTranslation } from "react-i18next";
import { LuMenu, LuShieldCheck, LuX } from "react-icons/lu";
import logo from "../../assets/logo.png";
import { useAnimatedPresence } from "../../lib/motion";

const NAV_LINKS = [
  { key: "nav.home", href: "#home" },
  { key: "nav.features", href: "#features" },
  { key: "nav.howItWorks", href: "#how-it-works" },
] as const;

type HeaderProps = {
  onSignIn: () => void;
};

export function Header({ onSignIn }: HeaderProps) {
  const { t } = useTranslation();
  // The menu drops down when opened and lifts away when closed.
  const menu = useAnimatedPresence();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <a href="#home" className="shrink-0">
          <img src={logo} alt={t("brand.logoAlt")} className="h-8 w-auto" />
        </a>

        <nav aria-label={t("nav.primary")} className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-12 pl-8">
            {NAV_LINKS.map((link, index) => (
              <li key={link.key}>
                <a
                  href={link.href}
                  aria-current={index === 0 ? "page" : undefined}
                  className={
                    index === 0
                      ? "border-b-2 border-primary pb-2 font-semibold text-primary"
                      : "pb-2 text-heading/80 transition-colors hover:text-primary"
                  }
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="hidden items-center gap-2 px-3 font-medium text-heading hover:text-primary md:flex"
          >
            <LuShieldCheck className="size-6" aria-hidden />
            {t("nav.signIn")}
          </button>
          <a
            href="#open-account"
            className="hidden rounded-full border border-primary px-5 py-2.5 font-medium text-primary transition-colors hover:bg-primary-light sm:inline-block"
          >
            {t("nav.openAccount")}
          </a>
          <a
            href="#get-app"
            className="hidden rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark sm:inline-block"
          >
            {t("nav.getApp")}
          </a>
          <button
            type="button"
            onClick={menu.toggle}
            aria-expanded={menu.isOpen}
            aria-controls="mobile-menu"
            aria-label={menu.isOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            className="ml-2 rounded-md p-1 text-heading hover:text-primary"
          >
            {menu.isOpen ? (
              <LuX className="size-8" aria-hidden />
            ) : (
              <LuMenu className="size-8" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {menu.mounted && (
        <nav
          id="mobile-menu"
          aria-label={t("nav.menu")}
          className={`border-t border-slate-100 bg-white motion-reduce:animate-none ${menu.closing ? "animate-menu-out" : "animate-menu-in"}`}
        >
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-10">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <a
                  href={link.href}
                  onClick={menu.close}
                  className="block rounded-md px-3 py-2 text-heading hover:bg-primary-light hover:text-primary"
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
            <li className="md:hidden">
              <button
                type="button"
                onClick={() => {
                  menu.close();
                  onSignIn();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-heading hover:bg-primary-light hover:text-primary"
              >
                <LuShieldCheck className="size-5" aria-hidden />
                {t("nav.signIn")}
              </button>
            </li>
            <li className="mt-2 flex flex-wrap gap-3 px-3 sm:hidden">
              <a
                href="#open-account"
                className="rounded-full border border-primary px-5 py-2 font-medium text-primary"
              >
                {t("nav.openAccount")}
              </a>
              <a
                href="#get-app"
                className="rounded-full bg-primary px-5 py-2 font-medium text-white"
              >
                {t("nav.getApp")}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
