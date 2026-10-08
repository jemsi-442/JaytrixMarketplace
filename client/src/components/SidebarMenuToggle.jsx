import { FiMenu } from "react-icons/fi";

export default function SidebarMenuToggle({ collapsed, onToggleCollapse, onOpenSidebar }) {
  const buttonClass = "h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#062A63] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <>
      <button type="button" onClick={onToggleCollapse} className={`${buttonClass} hidden lg:inline-flex`} aria-label={label} title={label} aria-expanded={!collapsed}>
        <FiMenu size={24} aria-hidden="true" />
      </button>
      <button type="button" onClick={onOpenSidebar} className={`${buttonClass} inline-flex lg:hidden`} aria-label="Open sidebar" title="Open sidebar">
        <FiMenu size={24} aria-hidden="true" />
      </button>
    </>
  );
}
