import { NavLink, useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiClock, FiGrid, FiLogOut, FiSettings, FiTruck, FiX } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import BrandMark from "../components/BrandMark";

const navItems = [
  { name: "Overview", path: "/rider", icon: FiGrid },
  { name: "Orders", path: "/rider/orders", icon: FiTruck },
  { name: "History", path: "/rider/history", icon: FiClock },
  { name: "Profile", path: "/rider/profile", icon: FiSettings },
];

export default function RiderSidebar({
  className = "",
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
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(11,95,255,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)] text-slate-200 transition-[width] duration-300 ease-out ${collapsed && !mobile ? "w-24" : "w-72"} ${className}`}
    >
      <div className={`flex items-start border-b border-white/10 py-6 ${collapsed && !mobile ? "justify-center px-4" : "justify-between px-6"}`}>
        <div className={collapsed && !mobile ? "flex justify-center" : ""}>
          <BrandMark context="Rider Console" light iconOnly={collapsed && !mobile} markClassName={collapsed && !mobile ? "h-12 w-12" : ""} />
          {collapsed && !mobile ? null : <p className="mt-1 text-xs tracking-wide text-slate-400">
            {user?.name || "Delivery workspace"}
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
              <FiTruck size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Shift</p>
              <p className="text-sm font-semibold text-white">Deliver, confirm, and move fast</p>
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
              end={item.path === "/rider"}
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
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
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
