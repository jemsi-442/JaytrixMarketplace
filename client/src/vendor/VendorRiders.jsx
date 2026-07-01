import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiDollarSign,
  FiDownload,
  FiKey,
  FiLoader,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import axios from "../utils/axios";
import { extractList, extractOne } from "../utils/apiShape";
import PageState from "../components/PageState";
import { useToast } from "../hooks/useToast";
import { formatRiderCurrency } from "../utils/riderEarnings";

export default function VendorRiders() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [settlingOrderId, setSettlingOrderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [riders, setRiders] = useState([]);
  const [earningsReport, setEarningsReport] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadRiders = async () => {
    setLoading(true);
    try {
      const [ridersResponse, earningsResponse] = await Promise.all([
        axios.get("/vendor/riders"),
        axios.get("/vendor/riders/earnings"),
      ]);
      setRiders(extractList(ridersResponse.data, ["items", "riders", "data"]));
      setEarningsReport(earningsResponse.data?.data || null);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load rider team.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const summary = useMemo(
    () => ({
      total: riders.length,
      active: riders.filter((rider) => rider.isActive).length,
      available: riders.filter((rider) => rider.available).length,
    }),
    [riders]
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setCreating(true);
      const { data } = await axios.post("/vendor/riders", form);
      const nextRider = extractOne(data);
      setRiders((current) => [nextRider, ...current]);
      loadRiders();
      setForm({ name: "", email: "", phone: "", password: "" });
      toast.success(data?.message || "Rider created successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create rider");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (rider, payload) => {
    try {
      setUpdatingId(rider.id);
      const { data } = await axios.patch(`/vendor/riders/${rider.id}/status`, payload);
      const updated = extractOne(data);
      setRiders((current) =>
        current.map((entry) => (entry.id === rider.id ? { ...entry, ...updated } : entry))
      );
      toast.success(data?.message || "Rider updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update rider");
    } finally {
      setUpdatingId(null);
    }
  };

  const resetPassword = async (rider) => {
    const password = window.prompt(`Set new password for ${rider.user?.email || rider.name}`);
    if (!password) return;

    try {
      setUpdatingId(rider.id);
      const { data } = await axios.patch(`/vendor/riders/${rider.id}/password`, { password });
      toast.success(data?.message || "Password reset successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reset rider password");
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadPaySheet = async () => {
    try {
      setExporting(true);
      const response = await axios.get("/vendor/riders/earnings/export.csv", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "text/csv;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vendor-rider-pay-sheet-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rider pay sheet downloaded");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to download rider pay sheet");
    } finally {
      setExporting(false);
    }
  };

  const updateRiderSettlement = async (order, paid) => {
    const paymentNote = paid ? window.prompt("Optional payment note", "Settled directly with rider") : "";
    if (paid && paymentNote === null) return;

    try {
      setSettlingOrderId(order.id);
      const { data } = await axios.patch(`/vendor/riders/earnings/orders/${order.id}/settlement`, {
        paid,
        paymentNote,
      });
      setEarningsReport(data?.data || null);
      toast.success(data?.message || "Rider payment record updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update rider payment record");
    } finally {
      setSettlingOrderId(null);
    }
  };

  const earningsSummary = earningsReport?.summary || {};
  const earningsItems = Array.isArray(earningsReport?.items) ? earningsReport.items : [];

  if (loading) {
    return <PageState title="Loading rider team" description="Preparing your delivery crew..." />;
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-[28px] border border-[#062A63]/10 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#fff7ed_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#062A63]">Delivery Team</p>
        <h1 className="mt-1 text-xl font-black text-slate-900 md:text-2xl">Vendor Riders</h1>
        <p className="mt-2 text-slate-500">Create riders for your store and keep their delivery status under your control.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Riders</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{summary.total}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Active</p>
          <p className="mt-3 text-2xl font-black text-[#062A63]">{summary.active}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Available</p>
          <p className="mt-3 text-2xl font-black text-orange-700">{summary.available}</p>
        </article>
      </section>

      <section className="surface-panel-lg overflow-hidden">
        <div className="grid gap-4 border-b border-slate-200/70 bg-[linear-gradient(135deg,#062A63_0%,#0B1F34_58%,#0B5FFF_140%)] p-5 text-white md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-100">Rider Pay Sheet</p>
            <h2 className="mt-1 text-xl font-black">Vendor-managed rider earnings</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-50">
              Use this report to settle riders directly after completed deliveries. The platform records the estimate, while payment remains between your store and your rider.
            </p>
            <button
              type="button"
              onClick={downloadPaySheet}
              disabled={exporting}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#062A63] shadow-sm transition hover:bg-orange-50 disabled:opacity-60"
            >
              {exporting ? <FiLoader className="animate-spin" /> : <FiDownload />}
              {exporting ? "Preparing pay sheet..." : "Download pay sheet"}
            </button>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 text-right backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">Projected Pay</p>
            <p className="mt-1 text-2xl font-black">{formatRiderCurrency(earningsSummary.projectedTotal)}</p>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Earned</p>
            <p className="mt-2 text-xl font-black text-emerald-700">{formatRiderCurrency(earningsSummary.earnedTotal)}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Unpaid</p>
            <p className="mt-2 text-xl font-black text-red-700">{formatRiderCurrency(earningsSummary.unpaidTotal)}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pending Trips</p>
            <p className="mt-2 text-xl font-black text-[#062A63]">{formatRiderCurrency(earningsSummary.pendingTotal)}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trip Bonuses</p>
            <p className="mt-2 text-xl font-black text-orange-700">{formatRiderCurrency(earningsSummary.bonusTotal)}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Completed</p>
            <p className="mt-2 text-xl font-black text-slate-900">{earningsSummary.completedDeliveries || 0} deliveries</p>
          </article>
        </div>

        <div className="border-t border-slate-200/70">
          {earningsItems.length ? (
            <div className="divide-y divide-slate-100">
              {earningsItems.map((item) => (
                <article key={item.rider?.id} className="grid gap-4 p-4 lg:grid-cols-[1.1fr_1.4fr] lg:items-start">
                  <div className="flex gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                      <FiDollarSign />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{item.rider?.name || "Rider"}</h3>
                      <p className="text-sm text-slate-500">{item.rider?.phone || "No phone number"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{item.completedDeliveries} completed</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-[#062A63]">{item.activeDeliveries} active</span>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">{formatRiderCurrency(item.bonusTotal)} bonus</span>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{formatRiderCurrency(item.unpaidTotal)} unpaid</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Earned</p>
                        <p className="mt-1 font-black text-emerald-700">{formatRiderCurrency(item.earnedTotal)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Paid</p>
                        <p className="mt-1 font-black text-[#062A63]">{formatRiderCurrency(item.paidTotal)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Unpaid</p>
                        <p className="mt-1 font-black text-red-700">{formatRiderCurrency(item.unpaidTotal)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Projected</p>
                        <p className="mt-1 font-black text-slate-900">{formatRiderCurrency(item.projectedTotal)}</p>
                      </div>
                    </div>
                    {item.recentOrders?.length ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recent Rider Jobs</p>
                        <div className="mt-2 divide-y divide-slate-100">
                          {item.recentOrders.map((order) => {
                            const delivered = order.status === "delivered";
                            const paid = Boolean(order.riderPaidAt);
                            return (
                              <div key={order.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">Order #{order.id} · {formatRiderCurrency(order.earning?.amount)}</p>
                                  <p className="text-xs text-slate-500">
                                    {order.status.replace(/_/g, " ")} · {paid ? "Rider paid" : delivered ? "Awaiting rider payment" : "Payment unlocks after delivery"}
                                  </p>
                                </div>
                                {delivered ? (
                                  <button
                                    type="button"
                                    disabled={settlingOrderId === order.id}
                                    onClick={() => updateRiderSettlement(order, !paid)}
                                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                                      paid
                                        ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        : "bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] text-white shadow-sm"
                                    }`}
                                  >
                                    {settlingOrderId === order.id ? (
                                      <FiLoader className="animate-spin" />
                                    ) : paid ? (
                                      <FiXCircle />
                                    ) : (
                                      <FiCheckCircle />
                                    )}
                                    {paid ? "Mark unpaid" : "Mark paid"}
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8">
              <PageState tone="info" title="No rider earnings yet" description="Completed delivery earnings will appear here after riders start handling orders." />
            </div>
          )}
        </div>
      </section>

      {error ? <PageState tone="error" title="Riders unavailable" description={error} /> : null}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleCreate} className="surface-panel-lg p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600">
              <FiPlus />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Create Rider</h2>
              <p className="mt-1 text-sm text-slate-500">This rider will belong to your store and can receive your deliveries.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input className="input" placeholder="Rider name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <input type="email" className="input" placeholder="rider@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="input" placeholder="Phone number" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
            <input type="password" className="input" placeholder="Temporary password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={creating} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {creating ? <FiLoader className="animate-spin" /> : <FiPlus />}
              {creating ? "Saving rider..." : "Save Rider"}
            </button>
          </div>
        </form>

        <section className="surface-panel-wrap">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] text-slate-600">
                <tr>
                  <th className="p-3 text-left">Rider</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Active</th>
                  <th className="p-3 text-left">Available</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.id} className="border-t border-slate-100 transition hover:bg-orange-50/30">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{rider.name}</div>
                      <div className="text-xs text-slate-500">{rider.user?.email || "No login email"}</div>
                    </td>
                    <td className="p-3 text-slate-600">{rider.phone}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rider.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {rider.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rider.available ? "bg-slate-100 text-[#062A63]" : "bg-slate-200 text-slate-700"}`}>
                        {rider.available ? "Available" : "Busy"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingId === rider.id}
                          onClick={() => resetPassword(rider)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#062A63]/15 bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-3 py-1.5 text-white shadow-sm disabled:opacity-60"
                        >
                          <FiKey />
                          Reset Password
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === rider.id}
                          onClick={() => updateStatus(rider, { isActive: !rider.isActive })}
                          className="inline-flex items-center gap-1 rounded-xl border border-orange-300 bg-[linear-gradient(135deg,#0B5FFF_0%,#053A8C_100%)] px-3 py-1.5 text-white shadow-sm disabled:opacity-60"
                        >
                          {rider.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                          {rider.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === rider.id}
                          onClick={() => updateStatus(rider, { available: !rider.available })}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-600 bg-[linear-gradient(135deg,#334155_0%,#0f172a_100%)] px-3 py-1.5 text-white shadow-sm disabled:opacity-60"
                        >
                          {rider.available ? <FiToggleRight /> : <FiToggleLeft />}
                          {rider.available ? "Mark Busy" : "Mark Available"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!riders.length ? (
            <div className="border-t border-slate-200/70 px-4 py-8">
              <PageState tone="info" title="No riders yet" description="Create your first rider to start handling your store deliveries." />
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
