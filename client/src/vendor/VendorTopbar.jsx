import SidebarMenuToggle from "../components/SidebarMenuToggle";
import { FiAlertCircle, FiPackage, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function VendorTopbar({ activeIssueCount = 0, onOpenSidebar, collapsed, onToggleCollapse }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 relative flex h-16 items-center justify-between overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,rgba(248,250,252,0.96)_0%,rgba(239,246,255,0.95)_48%,rgba(255,247,237,0.95)_100%)] px-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(6,42,99,0)_0%,rgba(6,42,99,0.75)_38%,rgba(11,95,255,0.6)_78%,rgba(11,95,255,0)_100%)]" />
      <div className="flex items-center gap-3">
        <SidebarMenuToggle collapsed={collapsed} onToggleCollapse={onToggleCollapse} onOpenSidebar={onOpenSidebar} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#062A63]">
            Vendor Space
          </p>
          <p className="text-base font-black text-slate-900 md:text-lg">Store Operations</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <Link
          to="/vendor/delivery-issues"
          className="relative rounded-full border border-white/80 bg-white/80 p-2.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-red-700"
          aria-label="Delivery issues"
          title="Delivery issues"
        >
          <FiAlertCircle size={18} />
          {activeIssueCount > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-300/30">
              {activeIssueCount}
            </span>
          ) : null}
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-slate-700 shadow-sm sm:flex">
          <FiPackage />
          <span className="text-sm font-medium">Your catalog, your orders</span>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-slate-700 shadow-sm sm:flex">
          <FiUser />
          <span className="text-sm font-medium">{user?.name || "Vendor"}</span>
        </div>
      </div>
    </header>
  );
}
