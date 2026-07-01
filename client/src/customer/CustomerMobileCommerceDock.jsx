import { Link } from "react-router-dom";
import { FiHeart, FiHome, FiShoppingBag, FiShoppingCart } from "react-icons/fi";
import { useCart } from "../hooks/useCart";
import { useSavedProducts } from "../hooks/useSavedProducts";

const dockItems = [
  { label: "Home", path: "/account", icon: FiHome },
  { label: "Shop", path: "/shop", icon: FiShoppingBag },
  { label: "Saved", path: "/account/wishlist", icon: FiHeart, countKey: "saved" },
  { label: "Cart", path: "/cart", icon: FiShoppingCart, countKey: "cart" },
];

export default function CustomerMobileCommerceDock() {
  const { cartCount } = useCart();
  const { savedProducts } = useSavedProducts();

  const counts = {
    cart: cartCount,
    saved: savedProducts.length,
  };

  return (
    <nav className="border-b border-white/70 bg-white/85 px-3 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:hidden">
      <div className="grid grid-cols-4 gap-2">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const count = counts[item.countKey] || 0;

          return (
            <Link
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-[#062A63]/20 hover:text-[#062A63]"
            >
              <Icon size={18} />
              <span className="mt-1">{item.label}</span>
              {count > 0 ? (
                <span className="absolute right-2 top-1 min-w-[18px] rounded-full bg-[#062A63] px-1.5 py-0.5 text-[10px] text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
