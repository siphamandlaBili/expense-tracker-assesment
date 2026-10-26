import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router";
import { useProfile } from "../../api/queries";
import { preloadDashboardPages } from "../../app/pages";
import { useAuth, useSession } from "../../auth/AuthContext";
import { BottomNav } from "../../components/dashboard/BottomNav";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { TopBar } from "../../components/dashboard/TopBar";
import { useMediaQuery } from "../../lib/useMediaQuery";

export function DashboardLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const session = useSession();
  // Shared with the pages that also use it, so no extra request.
  const profile = useProfile(session.customerId);
  const navigate = useNavigate();
  // One navigation at a time: the sidebar from md (tablets) up, the bottom
  // bar on phones.
  const hasSidebar = useMediaQuery("(min-width: 48rem)");

  // The current page loads first; the rest follow in the background.
  useEffect(() => {
    void preloadDashboardPages();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-dashboard md:flex">
      {hasSidebar && <Sidebar onSignOut={handleSignOut} />}
      <div className="min-w-0 flex-1">
        <TopBar
          name={session.name}
          email={profile.data?.email}
          onSignOut={handleSignOut}
        />
        {/* Below md the bottom bar is fixed over the page, so the content
            gets room to scroll clear of it (bar height + safe area). */}
        <main className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-6 lg:px-8">
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
      {!hasSidebar && <BottomNav />}
    </div>
  );
}
