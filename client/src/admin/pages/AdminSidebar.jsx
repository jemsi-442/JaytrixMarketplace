import { NavLink, useNavigate } from "react-router-dom";
import { FiAlertCircle, FiBell, FiCreditCard, FiHome, FiLogOut, FiPackage, FiShoppingBag, FiUsers, FiX } from "react-icons/fi";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { useAuth } from "../../hooks/useAuth";
import BrandMark from "../../components/BrandMark";

const navItems = [
  { name: "Marketplace Home", path: "/admin", icon: FiHome },
  { name: "Catalog", path: "/admin/products", icon: FiPackage },
  { name: "Sales", path: "/admin/orders", icon: FiShoppingBag },
  { name: "Delivery Issues", path: "/admin/delivery-issues", icon: FiAlertCircle },
  { name: "Customers", path: "/admin/users", icon: FiUsers },
  { name: "Updates", path: "/admin/notifications", icon: FiBell },
  { name: "Vendor Settlements", path: "/admin/payouts", icon: FiCreditCard },
];

export default function AdminSidebar({
  className = "",
  unreadCount = 0,
  activeIssueCount = 0,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(11,95,255,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)] text-slate-200 transition-[width] duration-300 ease-out ${collapsed && !mobile ? "w-24" : "w-72"} ${className}`}
    >
      <div className={`relative border-b border-white/10 py-6 ${collapsed && !mobile ? "px-4" : "px-6"}`}>
        <div className={`flex gap-4 ${collapsed && !mobile ? "flex-col items-center" : "items-start justify-between"}`}>
          <div className={collapsed && !mobile ? "flex justify-center" : ""}>
            <BrandMark context="Operations Hub" light iconOnly={collapsed && !mobile} markClassName={collapsed && !mobile ? "h-12 w-12" : ""} />
          </div>
          {!mobile ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 lg:inline-flex"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <TbLayoutSidebarLeftExpand size={24} aria-hidden="true" /> : <TbLayoutSidebarLeftCollapse size={24} aria-hidden="true" />}
            </button>
          ) : null}
          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
              aria-label="Close sidebar"
            >
              <FiX size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <nav className={`flex-1 space-y-2 py-6 ${collapsed && !mobile ? "px-3" : "px-4"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/admin"}
              onClick={() => onNavigate?.()}
              title={collapsed && !mobile ? item.name : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-2xl py-3 text-sm font-medium transition ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"} ${
                  isActive
                    ? "border border-sky-300/25 bg-sky-400/15 text-sky-100 shadow-[0_14px_30px_rgba(11,95,255,0.16)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={collapsed && !mobile ? 25 : 21} />
              {collapsed && !mobile ? null : <span>{item.name}</span>}
              {collapsed && !mobile ? (
                <span className="pointer-events-none absolute left-[calc(100%+0.75rem)] z-50 whitespace-nowrap rounded-xl border border-slate-800/10 bg-white px-3 py-2 text-xs font-bold text-slate-900 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition group-hover:opacity-100">
                  {item.name}
                </span>
              ) : null}
              {item.path === "/admin/delivery-issues" && activeIssueCount > 0 ? (
                <span className={`${collapsed && !mobile ? "absolute right-1 top-1" : "ml-auto"} rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20`}>
                  {activeIssueCount}
                </span>
              ) : null}
              {item.path === "/admin/notifications" && unreadCount > 0 ? (
                <span className={`${collapsed && !mobile ? "absolute right-1 top-1" : "ml-auto"} rounded-full bg-[linear-gradient(135deg,#1273ff_0%,#f97316_100%)] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-amber-500/20`}>
                  {unreadCount}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={onLogout}
          className={`flex w-full items-center rounded-2xl py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"}`}
          title={collapsed && !mobile ? "Sign out" : undefined}
        >
          <FiLogOut size={collapsed && !mobile ? 25 : 21} />
          {collapsed && !mobile ? null : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
