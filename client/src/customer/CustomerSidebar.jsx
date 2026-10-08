import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiCreditCard, FiHeart, FiHome, FiLogOut, FiShoppingBag, FiShield, FiUser, FiX } from "react-icons/fi";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from "react-icons/tb";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { name: "Overview", path: "/account", icon: FiHome },
  { name: "Shop", path: "/account/shop", icon: FiShoppingBag },
  { name: "Cart & Payment", path: "/account/cart", icon: FiCreditCard },
  { name: "Orders", path: "/account/orders", icon: FiShoppingBag },
  { name: "Saved Picks", path: "/account/wishlist", icon: FiHeart },
  { name: "Updates", path: "/account/updates", icon: FiBell },
  { name: "Profile", path: "/account/profile", icon: FiUser },
  { name: "Support", path: "/account/support", icon: FiShield },
];

export default function CustomerSidebar({
  className = "",
  unreadCount = 0,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(11,95,255,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)] text-slate-200 transition-[width] duration-300 ease-out ${collapsed && !mobile ? "w-24" : "w-72"} ${className}`}
    >
      <div className={`flex gap-4 border-b border-white/10 py-6 ${collapsed && !mobile ? "flex-col items-center px-4" : "items-start justify-between px-6"}`}>
        <div className={collapsed && !mobile ? "flex justify-center" : ""}>
          <BrandMark context="Shopper Hub" light iconOnly={collapsed && !mobile} markClassName={collapsed && !mobile ? "h-12 w-12" : ""} />
          {collapsed && !mobile ? null : (
            <p className="mt-2 text-xs tracking-wide text-slate-400">
              {user?.name ? `${user.name}'s marketplace` : "Your marketplace control center"}
            </p>
          )}
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

      {collapsed && !mobile ? null : (
        <div className="px-4 pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.2)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Shopping status</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "Everything is up to date"}
            </p>
          </div>
        </div>
      )}

      <nav className={`flex-1 space-y-1.5 py-6 ${collapsed && !mobile ? "px-3" : "px-4"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/account"
            ? location.pathname === "/account"
            : item.path === "/account/shop"
              ? location.pathname === item.path || location.pathname.startsWith("/account/product") || location.pathname.startsWith("/account/stores")
              : item.path === "/account/cart"
                ? location.pathname === item.path || location.pathname === "/account/checkout"
                : location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => onNavigate?.()}
              title={collapsed && !mobile ? item.name : undefined}
              className={`group relative flex items-center rounded-xl py-3 text-sm font-medium transition ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"} ${
                isActive
                  ? "border border-sky-300/20 bg-sky-400/15 text-sky-200"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={collapsed && !mobile ? 25 : 21} />
              {collapsed && !mobile ? null : <span>{item.name}</span>}
              {item.path === "/account/updates" && unreadCount > 0 ? (
                <span className={`${collapsed && !mobile ? "absolute right-1 top-1" : "ml-auto"} rounded-full bg-[linear-gradient(135deg,#062A63_0%,#0B5FFF_100%)] px-2 py-0.5 text-[10px] font-bold text-white`}>
                  {unreadCount}
                </span>
              ) : null}
              {collapsed && !mobile ? (
                <span className="pointer-events-none absolute left-[calc(100%+0.75rem)] z-50 whitespace-nowrap rounded-xl border border-slate-800/10 bg-white px-3 py-2 text-xs font-bold text-slate-900 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition group-hover:opacity-100">
                  {item.name}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white ${collapsed && !mobile ? "justify-center px-3" : "gap-3 px-4"}`}
          title={collapsed && !mobile ? "Sign out" : undefined}
        >
          <FiLogOut size={collapsed && !mobile ? 25 : 21} />
          {collapsed && !mobile ? null : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
