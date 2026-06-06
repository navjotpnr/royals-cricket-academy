import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AttendancePage from "@/pages/AttendancePage";
import FeeTrackerPage from "@/pages/FeeTrackerPage";
import HistoryPage from "@/pages/HistoryPage";
import LoginPage from "@/pages/LoginPage";
import MonthlyFeesPage from "@/pages/MonthlyFeesPage";
import MonthlyReportPage from "@/pages/MonthlyReportPage";
import PlayerProfilePage from "@/pages/PlayerProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import { useAuthStore } from "@/store/auth-store";
import {
  Outlet,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";

// Root route
export const rootRoute = createRootRoute({
  component: Outlet,
});

// Login route
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LoginPage,
  beforeLoad: () => {
    const { adminAuthenticated, role } = useAuthStore.getState();
    if (adminAuthenticated && role === "admin") {
      throw redirect({ to: "/admin" });
    }
  },
});

const SESSION_MAX_MS = 8 * 60 * 60 * 1000; // 8 hours

// Admin guard route
export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: Outlet,
  beforeLoad: () => {
    const { adminAuthenticated, loginTime, logout } = useAuthStore.getState();
    if (!adminAuthenticated) {
      throw redirect({ to: "/" });
    }
    // Expire session after 8 hours
    if (!loginTime || Date.now() - loginTime > SESSION_MAX_MS) {
      logout();
      throw redirect({ to: "/" });
    }
  },
});

export const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminDashboardPage,
});

export const adminRegisterRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/register",
  component: RegisterPage,
});

export const adminMonthlyFeesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/monthly-fees",
  component: MonthlyFeesPage,
});

export const adminFeeTrackerRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/fee-tracker",
  component: FeeTrackerPage,
});

export const adminAttendanceRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/attendance",
  component: AttendancePage,
});

export const adminHistoryRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/history",
  component: HistoryPage,
});
export const adminMonthlyReportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/monthly-report",
  component: MonthlyReportPage,
});

// Player profile route
export const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/player/$id",
  component: PlayerProfilePage,
  beforeLoad: () => {
    const { playerStudent, adminAuthenticated } = useAuthStore.getState();
    if (!playerStudent && !adminAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
});
