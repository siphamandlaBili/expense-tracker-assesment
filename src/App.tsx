import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { DashboardLayout } from "./pages/dashboard/DashboardLayout";
import { GoalsPage } from "./pages/dashboard/GoalsPage";
import { OverviewPage } from "./pages/dashboard/OverviewPage";
import { ProfilePage } from "./pages/dashboard/ProfilePage";
import { SpendingPage } from "./pages/dashboard/SpendingPage";
import { TransactionsPage } from "./pages/dashboard/TransactionsPage";
import { LandingPage } from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route
        path="dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="spending" element={<SpendingPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
