import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiShield, FiStar, FiTruck } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import MarketplaceRating from "../components/MarketplaceRating";
import api from "../utils/axios";
import { extractList } from "../utils/apiShape";
import { PLACEHOLDER_IMAGE, resolveImageUrl } from "../utils/image";

const trustPoints = [
  {
    icon: FiShield,
    title: "Trusted sellers",
    desc: "Every store on the marketplace goes through review before products go live.",
  },
  {
    icon: FiTruck,
    title: "Smooth delivery",
    desc: "Orders, payments, and rider handoff stay clear from checkout to doorstep.",
  },
  {
    icon: FiStar,
    title: "Better picks",
    desc: "Shoppers see stronger products first, while sellers get space to build a brand.",
  },
];

const quickCollections = [
  {
    title: "Fresh arrivals",
    subtitle: "Recently added pieces shoppers are starting to notice.",
    search: "new",
    color: "from-[#062A63] via-[#07306B] to-[#0B5FFF]",
  },
  {
    title: "Best value",
    subtitle: "Easy picks for customers who want strong value at a good price.",
    price: "0-50000",
    color: "from-[#0B5FFF] via-[#1273FF] to-[#5EA4FF]",
  },
  {
    title: "Statement picks",
    subtitle: "Premium products that deserve the front row of the marketplace.",
    price: "100000-10000000",
    color: "from-[#062A63] via-[#0A3A78] to-[#0B5FFF]",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?status=approved');
        const rawProducts = extractList(data, ['products', 'items']);
        const normalized = rawProducts.map((product) => ({
          ...product,
          image: resolveImageUrl([product.imageUrl, product.image, ...(product.images || [])], PLACEHOLDER_IMAGE),
          countInStock:
            typeof product.countInStock === 'number'
              ? product.countInStock
              : typeof product.stock === 'number'
                ? product.stock
                : 0,
        }));

        if (mounted) {
          setProducts(normalized);
        }
      } catch (error) {
        if (mounted) {
          setProducts([]);
        }
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  const marketplaceStats = useMemo(() => {
    const uniqueStores = new Map();
    let inStock = 0;

    products.forEach((product) => {
      if (product.vendor?.storeSlug) {
        uniqueStores.set(product.vendor.storeSlug, product.vendor);
      }
      if ((product.countInStock || 0) > 0) {
        inStock += 1;
      }
    });

    return {
      products: products.length,
      stores: uniqueStores.size,
      readyToShip: inStock,
    };
  }, [products]);


  return (
    <div className="w-full overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_36%,#fff7ed_100%)] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,95,255,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(94,164,255,0.13),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)]" />
        <div className="absolute -left-16 top-24 h-48 w-48 rounded-full bg-sky-400/18 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-200/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-24">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.28em] text-sky-100">
              Discover trusted sellers in one place
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl">
              The marketplace built to help shoppers buy faster
              <span className="block bg-[linear-gradient(90deg,#e0f2fe_0%,#5ea4ff_58%,#ffffff_100%)] bg-clip-text text-transparent">
                and sellers grow with confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base text-slate-200 md:text-lg">
              Explore live products, discover branded stores, pay with mobile money, and follow every order from checkout to delivery without the usual guesswork.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/account/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(6,42,99,0.32)] transition hover:-translate-y-0.5">
                Explore Marketplace <FiArrowRight />
              </Link>
              {!user ? (
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Open Your Account
                </Link>
              ) : (
                <Link to="/account/orders" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Open My Dashboard
                </Link>
              )}
            </div>

            {user ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                <Link to="/account/wishlist" className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 transition hover:bg-white/15">
                  Saved picks
                </Link>
                <Link to="/account/cart" className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 transition hover:bg-white/15">
                  Cart
                </Link>
                <Link to="/account/orders" className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 transition hover:bg-white/15">
                  Track orders
                </Link>
              </div>
            ) : null}

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <StatPill label="Live products" value={marketplaceStats.products} />
              <StatPill label="Active stores" value={marketplaceStats.stores} />
              <StatPill label="Ready to ship" value={marketplaceStats.readyToShip} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative">
            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-2xl shadow-slate-950/35">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Marketplace promise</p>
                <div className="mt-5 space-y-4">
                  {trustPoints.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-white/10 p-3 text-sky-100">
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.07)_100%)] p-5 backdrop-blur-xl shadow-2xl shadow-black/35">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Now trending</p>
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="aspect-[4/4.4] overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                    <img
                      src={featuredProducts[0]?.image || '/images/hero-bag.png'}
                      alt={featuredProducts[0]?.name || 'Marketplace hero product'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{featuredProducts[0]?.name || 'Seller-ready featured product'}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {featuredProducts[0]?.vendor?.storeName || featuredProducts[0]?.vendor?.name || 'Curated marketplace pick'}
                      </p>
                      {featuredProducts[0] ? (
                        <div className="mt-3">
                          <MarketplaceRating
                            averageRating={featuredProducts[0].averageRating}
                            reviewCount={featuredProducts[0].reviewCount}
                            compact
                            tone="dark"
                          />
                        </div>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-orange-100">
                      {featuredProducts[0]?.price ? `TZS ${Number(featuredProducts[0].price).toLocaleString()}` : 'Top pick'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {quickCollections.slice(0, 2).map((item) => (
                    <Link
                      key={item.title}
                      to={`/account/shop?${item.price ? `price=${item.price}` : `search=${encodeURIComponent(item.search)}`}`}
                      className={`rounded-2xl bg-gradient-to-br ${item.color} p-[1px] transition hover:-translate-y-0.5`}
                    >
                      <div className="rounded-[calc(1rem-1px)] bg-slate-950/80 px-4 py-4 text-white">
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-200">{item.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="overflow-hidden rounded-[34px] border border-[#062A63]/10 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_52%,#fff7ed_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#062A63]">One customer hub</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Shopping, saved picks, checkout, and tracking now live inside your dashboard.
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                The home page introduces JAYTRIX. Once a customer signs in, the full shopping journey stays in one private workspace with sidebar navigation, cart, payment, updates, and orders together.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/account" className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  Open dashboard <FiArrowRight />
                </Link>
                <Link to="/account/shop" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Shop inside dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Shop", "Browse products without leaving the customer hub."],
                ["Cart & payment", "Review the basket and approve mobile money in one place."],
                ["Saved picks", "Keep products and stores ready for later."],
                ["Orders", "Track payment, delivery, and support updates together."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
                  <p className="font-black text-slate-900">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}
