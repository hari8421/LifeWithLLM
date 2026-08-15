import { Route, Routes } from "react-router-dom";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import { RequireAuth } from "@/components/RequireAuth";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import ChatPage from "@/pages/dashboard/ChatPage";
import ResearchPage from "@/pages/dashboard/ResearchPage";
import ShoppingPage from "@/pages/dashboard/ShoppingPage";
import SocialPage from "@/pages/dashboard/SocialPage";
import JobsPage from "@/pages/dashboard/JobsPage";
import CareerPage from "@/pages/dashboard/CareerPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="career" element={<CareerPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
