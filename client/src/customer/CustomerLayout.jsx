import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import InternalFooter from "../components/InternalFooter";
import { useAuth } from "../hooks/useAuth";
import useNotificationAlerts from "../hooks/useNotificationAlerts";
import useNotificationPreferences from "../hooks/useNotificationPreferences";
import useNotificationSummary from "../hooks/useNotificationSummary";
import CustomerSidebar from "./CustomerSidebar";
import CustomerMobileCommerceDock from "./CustomerMobileCommerceDock";
import CustomerTopbar from "./CustomerTopbar";

export default function CustomerLayout() {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => localStorage.getItem("jaytrix:customer-sidebar-collapsed") === "true");
  const notificationPreferences = useNotificationPreferences("customer");
  const notificationSummary = useNotificationSummary({
    enabled: user?.role === "customer",
    mode: "customer",
  });
  const { unreadCount } = notificationSummary;

  useNotificationAlerts({
    enabled: user?.role === "customer",
    mode: "customer",
    soundEnabled: notificationPreferences.soundEnabled,
    vibrationEnabled: notificationPreferences.vibrationEnabled,
  });

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("jaytrix:customer-sidebar-collapsed", String(desktopSidebarCollapsed));
  }, [desktopSidebarCollapsed]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_38%,#fff7ed_100%)]">
      <CustomerSidebar
        className="hidden lg:flex"
        unreadCount={unreadCount}
        collapsed={desktopSidebarCollapsed}
        onToggleCollapse={() => setDesktopSidebarCollapsed((value) => !value)}
      />

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Close dashboard menu overlay"
          />
          <CustomerSidebar
            mobile
            unreadCount={unreadCount}
            onNavigate={() => setMobileSidebarOpen(false)}
            onClose={() => setMobileSidebarOpen(false)}
            className="relative z-10 min-h-full shadow-2xl"
          />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CustomerTopbar unreadCount={unreadCount} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <CustomerMobileCommerceDock />
        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(11,95,255,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eff6ff_52%,#fff7ed_100%)]">
          <Outlet />
        </main>
        <InternalFooter />
      </div>
    </div>
  );
}
