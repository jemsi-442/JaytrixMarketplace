import { NavLink, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiPackage,
  FiTruck,
  FiSettings,
  FiShoppingBag,
  FiHome,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import BrandMark from "../components/BrandMark";

const navItems = [
  { name: "Overview", path: "/vendor", icon: FiGrid },
  { name: "Products", path: "/vendor/products", icon: FiPackage },
  { name: "Orders", path: "/vendor/orders", icon: FiShoppingBag },
  { name: "Delivery Issues", path: "/vendor/delivery-issues", icon: FiAlertCircle },
  { name: "Riders", path: "/vendor/riders", icon: FiTruck },
  { name: "Payouts", path: "/vendor/payouts", icon: FiCreditCard },
  { name: "Store Profile", path: "/vendor/profile", icon: FiSettings },
];

export default function VendorSidebar({
  className = "",
  activeIssueCount = 0,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-900/10 bg-[linear-gradient(180deg,#031326_0%,#062A63_48%,#151A21_100%)] text-slate-200 transition-[width] duration-300 ease-out ${collapsed && !mobile ? "w-24" : "w-72"} ${className}`}
    >
      <div className={`flex items-start border-b border-white/10 py-6 ${collapsed && !mobile ? "justify-center px-4" : "justify-between px-6"}`}>
        <div className={collapsed && !mobile ? "flex justify-center" : ""}>
          <BrandMark context="Vendor Workspace" light iconOnly={collapsed && !mobile} markClassName={collapsed && !mobile ? "h-12 w-12" : ""} />
          {collapsed && !mobile ? null : <p className="mt-1 text-xs tracking-wide text-slate-400">
            {user?.storeName || "Seller workspace"}
          </p>}
        </div>
        {!mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
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

      {collapsed && !mobile ? null : <div className="px-4 pt-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
              <FiHome size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Store</p>
              <p className="text-sm font-semibold text-white">Build, review, and sell</p>
            </div>
          </div>
        </div>
      </div>}

      <nav className={`flex-1 space-y-1.5 py-6 ${collapsed && !mobile ? "px-3" : "px-4"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/vendor"}
              onClick={() => onNavigate?.()}
              title={collapsed && !mobile ? item.name : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl py-3 text-sm font-medium transition ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"} ${
                  isActive
                    ? "border border-sky-300/20 bg-sky-400/15 text-sky-200"
                    : "text-slate-300 hover:bg-white/5"
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
              {item.path === "/vendor/delivery-issues" && activeIssueCount > 0 ? (
                <span className={`${collapsed && !mobile ? "absolute right-1 top-1" : "ml-auto"} rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20`}>
                  {activeIssueCount}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"}`}
          title={collapsed && !mobile ? "Logout" : undefined}
        >
          <FiLogOut size={collapsed && !mobile ? 25 : 21} />
          {collapsed && !mobile ? null : "Logout"}
        </button>
      </div>
    </aside>
  );
}
