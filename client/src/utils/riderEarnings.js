const toSafeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

export const formatRiderCurrency = (value) => `TZS ${toSafeNumber(value).toLocaleString()}`;

export const getRiderEarning = (order) => toSafeNumber(order?.delivery?.earningEstimate?.amount);

export const getRiderSettlementLabel = (order) => {
  const settlement = order?.delivery?.earningEstimate?.settlement || {};
  return settlement.label || "Vendor-managed settlement";
};

export const getRiderSettlementTone = (order) => {
  const status = order?.delivery?.earningEstimate?.settlement?.status;
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "awaiting_vendor_payment") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-[#062A63]";
};

export const formatRiderEarningBreakdown = (order, fallback = "Estimated after delivery completion") => {
  const estimate = order?.delivery?.earningEstimate || {};
  const lines = estimate.lines || [];

  if (!lines.length) {
    return estimate.note || fallback;
  }

  const summary = estimate.summary?.label ? `${estimate.summary.label}. ` : "";
  const release = estimate.summary?.releaseCondition ? `${estimate.summary.releaseCondition}. ` : "";
  const settlement = estimate.summary?.settlementNote ? `${estimate.summary.settlementNote}. ` : "";
  const payment = estimate.settlement?.label ? `${estimate.settlement.label}. ` : "";
  const paymentNote = estimate.settlement?.note ? `Payment note: ${estimate.settlement.note}. ` : "";
  const breakdown = lines.map((line) => `${line.label}: ${formatRiderCurrency(line.amount)}`).join(" • ");

  return `${summary}${release}${payment}${paymentNote}${settlement}${breakdown}`;
};
