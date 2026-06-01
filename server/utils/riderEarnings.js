const DEFAULT_RIDER_DELIVERY_EARNING = 3000;
const DEFAULT_RIDER_BONUS_LIMIT = 50000;

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round((amount + 1e-9) * 100) / 100 : 0;
};

export const getRiderDeliveryEarningConfig = () => {
  const rawValue = process.env.RIDER_DELIVERY_EARNING;
  const configured = Number(rawValue);
  const usesConfiguredValue = rawValue !== undefined && Number.isFinite(configured) && configured >= 0;

  return {
    amount: usesConfiguredValue ? toMoney(configured) : DEFAULT_RIDER_DELIVERY_EARNING,
    source: usesConfiguredValue ? "configured" : "default",
  };
};

export const getRiderDeliveryEarning = () => {
  return getRiderDeliveryEarningConfig().amount;
};

export const getRiderBonusLimit = () => {
  const configured = Number(process.env.RIDER_BONUS_MAX_AMOUNT);
  return Number.isFinite(configured) && configured >= 0 ? toMoney(configured) : DEFAULT_RIDER_BONUS_LIMIT;
};

export const normalizeRiderBonusAmount = (value) => {
  const rawAmount = Number(value ?? 0);

  if (!Number.isFinite(rawAmount) || rawAmount < 0) {
    return {
      amount: null,
      error: "Bonus amount must be zero or more",
    };
  }

  const amount = toMoney(rawAmount);
  const limit = getRiderBonusLimit();

  if (amount > limit) {
    return {
      amount: null,
      error: `Bonus amount cannot exceed Tsh ${limit.toLocaleString()}`,
    };
  }

  return {
    amount,
    error: null,
  };
};

export const buildRiderEarningEstimate = (order = {}) => {
  const delivered = order.status === "delivered";
  const baseConfig = getRiderDeliveryEarningConfig();
  const baseAmount = baseConfig.amount;
  const bonusAmount = toMoney(order.riderBonusAmount || order.rider_bonus_amount || 0);
  const bonusLimit = getRiderBonusLimit();
  const amount = toMoney(baseAmount + bonusAmount);
  const bonusNote = order.riderBonusNote || order.rider_bonus_note || null;
  const riderPaidAt = order.riderPaidAt || order.rider_paid_at || null;
  const riderPaymentNote = order.riderPaymentNote || order.rider_payment_note || null;
  const settlementStatus = riderPaidAt ? "paid" : delivered ? "awaiting_vendor_payment" : "pending_delivery";

  return {
    amount,
    baseAmount,
    bonusAmount,
    bonusLimit,
    currency: "TZS",
    status: delivered ? "earned" : "pending_delivery",
    baseSource: baseConfig.source,
    bonusNote,
    settlement: {
      status: settlementStatus,
      paidAt: riderPaidAt,
      note: riderPaymentNote,
      label: riderPaidAt
        ? "Paid by vendor"
        : delivered
          ? "Awaiting vendor settlement"
          : "Pending delivery completion",
      actionOwner: "vendor",
    },
    funding: {
      payer: "vendor",
      settlementOwner: "vendor",
      companyLiability: false,
      note: "Rider pay is managed directly between the vendor and their rider.",
    },
    summary: {
      hasBonus: bonusAmount > 0,
      lineCount: bonusAmount > 0 ? 2 : 1,
      label: bonusAmount > 0 ? "Vendor-managed base + trip bonus" : "Vendor-managed base delivery earning",
      releaseCondition: delivered ? "Delivery completed" : "Complete delivery to unlock earning",
      settlementNote: "Vendor settles this rider pay directly.",
    },
    lines: [
      {
        label: "Base delivery earning",
        amount: baseAmount,
        source: baseConfig.source,
        payer: "vendor",
      },
      ...(bonusAmount > 0
        ? [
            {
              label: "Vendor trip bonus",
              amount: bonusAmount,
              note: bonusNote,
              payer: "vendor",
            },
          ]
        : []),
    ],
    note: delivered
      ? "Estimated rider earning for this completed delivery."
      : "Estimated earning unlocks after delivery is completed.",
  };
};
