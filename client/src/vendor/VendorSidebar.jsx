import { NavLink, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
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

export default function VendorSidebar({ className = "", activeIssueCount = 0, mobile = false, onNavigate, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-900/10 bg-[linear-gradient(180deg,#031326_0%,#062A63_48%,#151A21_100%)] text-slate-200 ${className}`}
    >
      <div className="flex items-start justify-between border-b border-white/10 px-6 py-6">
        <div>
          <BrandMark context="Vendor Workspace" light />
          <p className="mt-1 text-xs tracking-wide text-slate-400">
            {user?.storeName || "Seller workspace"}
          </p>
        </div>
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

      <div className="px-4 pt-5">
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
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/vendor"}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "border border-sky-300/20 bg-sky-400/15 text-sky-200"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              <span className="flex items-center gap-2">
                {item.name}
                {item.path === "/vendor/delivery-issues" && activeIssueCount > 0 ? (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20">
                    {activeIssueCount}
                  </span>
                ) : null}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition"
        >
          <FiLogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
