import { Link } from "react-router-dom";
import { FiCheckCircle, FiCreditCard, FiHeart, FiShoppingBag, FiTruck } from "react-icons/fi";

const journeySteps = [
  { label: "Discover", detail: "Find trusted products", href: "/shop", icon: FiShoppingBag },
  { label: "Save or cart", detail: "Keep strong picks", href: "/account/wishlist", icon: FiHeart },
  { label: "Checkout", detail: "Approve on phone", href: "/cart", icon: FiCreditCard },
  { label: "Track", detail: "Follow in dashboard", href: "/account/orders", icon: FiTruck },
];

const stepKey = (label) => label.toLowerCase().replaceAll(" ", "-");

export default function CustomerJourneyStrip({ active = "discover", compact = false, quiet = false }) {
  if (quiet) {
    return (
      <section className="rounded-[24px] border border-[#062A63]/10 bg-white/85 px-3 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.045)] backdrop-blur md:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#062A63]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#062A63]">
              Buyer flow
            </span>
            {journeySteps.map((step) => {
              const Icon = step.icon;
              const selected = active === stepKey(step.label);
              return (
                <Link
                  key={step.label}
                  to={step.href}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 ${
                    selected ? "border-[#062A63] bg-[#062A63] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#062A63]/30 hover:text-[#062A63]"
                  }`}
                >
                  <Icon className="text-sm" />
                  {step.label}
                </Link>
              );
            })}
          </div>
          <Link
            to="/account"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white transition hover:-translate-y-0.5"
          >
            <FiCheckCircle /> Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-[28px] border border-[#062A63]/10 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur ${compact ? "p-4" : "p-5 md:p-6"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#062A63]">Customer journey</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">One flow from discovery to delivery tracking</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Shop calmly, save what matters, approve mobile money on your phone, then track everything inside your dashboard.
          </p>
        </div>
        <Link
          to="/account"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          <FiCheckCircle /> My Dashboard
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {journeySteps.map((step) => {
          const Icon = step.icon;
          const selected = active === stepKey(step.label);
          return (
            <Link
              key={step.label}
              to={step.href}
              className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${
                selected
                  ? "border-[#062A63]/20 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl p-3 ${selected ? "bg-[#062A63] text-white" : "bg-white text-[#062A63]"}`}>
                  <Icon />
                </div>
                <div>
                  <p className="font-black text-slate-900">{step.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
