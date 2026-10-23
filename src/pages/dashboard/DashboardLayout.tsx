import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router";
import { useProfile } from "../../api/queries";
import { preloadDashboardPages } from "../../app/pages";
import { useAuth, useSession } from "../../auth/AuthContext";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { TopBar } from "../../components/dashboard/TopBar";
import { useAnimatedPresence } from "../../lib/motion";

export function DashboardLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const session = useSession();
  // Shared with the pages that also use it, so no extra request.
  const profile = useProfile(session.customerId);
  const navigate = useNavigate();
  // The mobile navigation drawer, which slides in and out.
  const menu = useAnimatedPresence();

  // The current page loads first; the rest follow in the background.
  useEffect(() => {
    void preloadDashboardPages();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-dashboard lg:flex">
      <Sidebar
        mobileOpen={menu.mounted}
        mobileClosing={menu.closing}
        onCloseMobile={menu.close}
        onSignOut={handleSignOut}
      />
      <div className="min-w-0 flex-1">
        <TopBar
          name={session.name}
          email={profile.data?.email}
          onSignOut={handleSignOut}
          menuOpen={menu.isOpen}
          onOpenMenu={menu.open}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {/* Pages are code-split; announce while one downloads. */}
          <Suspense
            fallback={
              <div role="status" aria-busy="true">
                <span className="sr-only">{t("dashboard.states.loading")}</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
