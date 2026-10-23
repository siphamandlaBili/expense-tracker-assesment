import { useId } from "react";
import { useTranslation } from "react-i18next";
import { LuBell } from "react-icons/lu";
import { useDropdown } from "../../lib/useDropdown";

/**
 * The top-bar bell. Notifications aren't part of the app, so the panel
 * always shows an empty state rather than a dead button.
 */
export function NotificationsMenu() {
  const { t } = useTranslation();
  const panelId = useId();
  const headingId = useId();
  const { open, rootRef, buttonRef, toggle } = useDropdown();

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={t("dashboard.topBar.notifications")}
        aria-expanded={open}
        aria-controls={panelId}
        className={`rounded-full p-2 text-heading transition-colors hover:bg-white hover:text-primary ${
          open ? "bg-white text-primary" : ""
        }`}
      >
        <LuBell className="size-5" aria-hidden />
      </button>

      <section
        id={panelId}
        aria-labelledby={headingId}
        hidden={!open}
        className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200/80 bg-white shadow-xl motion-safe:animate-menu-in"
      >
        <h2
          id={headingId}
          className="border-b border-slate-100 px-4 py-3 font-semibold text-heading"
        >
          {t("dashboard.topBar.notifications")}
        </h2>
        <p className="px-4 py-6 text-center text-sm text-body">
          {t("dashboard.topBar.noNotifications")}
        </p>
      </section>
    </div>
  );
}
