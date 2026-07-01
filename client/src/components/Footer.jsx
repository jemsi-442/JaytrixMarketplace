import { Link, useLocation } from "react-router-dom";
import BrandMark from "./BrandMark";

function SimpleFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/[0.86] px-4 py-5 text-center backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
        <p className="font-semibold tracking-[0.14em]">© 2026 JAYTRIX Systems</p>
        <p className="font-medium">Secure shopping, mobile money checkout, and tracked delivery.</p>
      </div>
    </footer>
  );
}

function FullFooter() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.3fr_0.8fr_1fr]">
        <div className="max-w-md">
          <Link to="/" aria-label="JAYTRIX home">
            <BrandMark context="Technology | Innovation | Excellence" light />
          </Link>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            A sharper marketplace experience for trusted stores, secure mobile money checkout, and reliable delivery.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Quick Links
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/shop" className="transition hover:text-white">
              Shop
            </Link>
            <Link to="/cart" className="transition hover:text-white">
              Cart
            </Link>
            <Link to="/account/wishlist" className="transition hover:text-white">
              Saved Picks
            </Link>
            <Link to="/account" className="transition hover:text-white">
              My Dashboard
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Contact
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>support@jaytrix.co.tz</p>
            <p>+255 683 186 987</p>
            <p>Dar es Salaam, Tanzania</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-6 py-4 text-center">
        <p className="text-xs font-medium tracking-[0.14em] text-slate-400">
          © 2026 JAYTRIX Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  const usesBrandFooter = pathname === "/" || pathname === "/login";

  return usesBrandFooter ? <FullFooter /> : <SimpleFooter />;
}
