import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import InternalFooter from "../components/InternalFooter";
import { useAuth } from "../hooks/useAuth";
import RiderSidebar from "./RiderSidebar";
import RiderTopbar from "./RiderTopbar";

export default function RiderLayout() {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => localStorage.getItem("jaytrix:rider-sidebar-collapsed") === "true");

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
    localStorage.setItem("jaytrix:rider-sidebar-collapsed", String(desktopSidebarCollapsed));
  }, [desktopSidebarCollapsed]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_36%,#fff7ed_100%)]">
      <RiderSidebar
        className="hidden lg:flex"
        collapsed={desktopSidebarCollapsed}
      />

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Close sidebar overlay"
          />
          <RiderSidebar
            mobile
            onNavigate={() => setMobileSidebarOpen(false)}
            onClose={() => setMobileSidebarOpen(false)}
            className="relative z-10 min-h-full shadow-2xl"
          />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <RiderTopbar collapsed={desktopSidebarCollapsed} onToggleCollapse={() => setDesktopSidebarCollapsed((value) => !value)} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">
            <main className="flex-1 bg-[linear-gradient(160deg,#f8fafc_0%,#eff6ff_52%,#fff7ed_100%)] p-4 pb-6 md:p-6">
              <Outlet />
            </main>
            <InternalFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
