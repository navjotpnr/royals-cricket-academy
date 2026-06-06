import { Toaster } from "@/components/ui/sonner";
import {
  adminAttendanceRoute,
  adminFeeTrackerRoute,
  adminHistoryRoute,
  adminIndexRoute,
  adminMonthlyFeesRoute,
  adminMonthlyReportRoute,
  adminRegisterRoute,
  adminRoute,
  loginRoute,
  playerRoute,
  rootRoute,
} from "@/routes";
import { useAuthStore } from "@/store/auth-store";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

const routeTree = rootRoute.addChildren([
  loginRoute,
  adminRoute.addChildren([
    adminIndexRoute,
    adminRegisterRoute,
    adminMonthlyFeesRoute,
    adminFeeTrackerRoute,
    adminAttendanceRoute,
    adminHistoryRoute,
    adminMonthlyReportRoute,
  ]),
  playerRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to rehydrate from localStorage before
    // rendering the router — this prevents beforeLoad guards from seeing
    // a stale (unauthenticated) state on first render on any new device.
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. synchronous storage), trigger immediately.
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  if (!hydrated) {
    // Blank screen while rehydrating — typically sub-frame, never visible.
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </Suspense>
  );
}
