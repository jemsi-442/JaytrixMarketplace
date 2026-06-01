import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRiderEarningEstimate,
  getRiderBonusLimit,
  getRiderDeliveryEarning,
  getRiderDeliveryEarningConfig,
  normalizeRiderBonusAmount,
} from "../utils/riderEarnings.js";

const withRiderEarningEnv = (value, callback) => {
  const previousValue = process.env.RIDER_DELIVERY_EARNING;

  if (value === undefined) {
    delete process.env.RIDER_DELIVERY_EARNING;
  } else {
    process.env.RIDER_DELIVERY_EARNING = value;
  }

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.RIDER_DELIVERY_EARNING;
    } else {
      process.env.RIDER_DELIVERY_EARNING = previousValue;
    }
  }
};

const withRiderBonusLimitEnv = (value, callback) => {
  const previousValue = process.env.RIDER_BONUS_MAX_AMOUNT;

  if (value === undefined) {
    delete process.env.RIDER_BONUS_MAX_AMOUNT;
  } else {
    process.env.RIDER_BONUS_MAX_AMOUNT = value;
  }

  try {
    callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.RIDER_BONUS_MAX_AMOUNT;
    } else {
      process.env.RIDER_BONUS_MAX_AMOUNT = previousValue;
    }
  }
};

test("rider delivery earning falls back to the default when env is missing or invalid", () => {
  withRiderEarningEnv(undefined, () => {
    assert.deepEqual(getRiderDeliveryEarningConfig(), { amount: 3000, source: "default" });
    assert.equal(getRiderDeliveryEarning(), 3000);
  });

  withRiderEarningEnv("-100", () => {
    assert.deepEqual(getRiderDeliveryEarningConfig(), { amount: 3000, source: "default" });
  });

  withRiderEarningEnv("not-a-number", () => {
    assert.deepEqual(getRiderDeliveryEarningConfig(), { amount: 3000, source: "default" });
  });
});

test("rider delivery earning uses configured values when valid", () => {
  withRiderEarningEnv("4500.555", () => {
    assert.deepEqual(getRiderDeliveryEarningConfig(), { amount: 4500.56, source: "configured" });
  });
});

test("rider bonus limit uses valid env values and falls back safely", () => {
  withRiderBonusLimitEnv(undefined, () => {
    assert.equal(getRiderBonusLimit(), 50000);
  });

  withRiderBonusLimitEnv("75000.555", () => {
    assert.equal(getRiderBonusLimit(), 75000.56);
  });

  withRiderBonusLimitEnv("-1", () => {
    assert.equal(getRiderBonusLimit(), 50000);
  });

  withRiderBonusLimitEnv("not-a-number", () => {
    assert.equal(getRiderBonusLimit(), 50000);
  });
});

test("rider bonus amount normalization rejects invalid values and rounds money safely", () => {
  withRiderBonusLimitEnv("50000", () => {
    assert.deepEqual(normalizeRiderBonusAmount("-10"), {
      amount: null,
      error: "Bonus amount must be zero or more",
    });

    assert.deepEqual(normalizeRiderBonusAmount("not-a-number"), {
      amount: null,
      error: "Bonus amount must be zero or more",
    });

    assert.deepEqual(normalizeRiderBonusAmount("50000.01"), {
      amount: null,
      error: "Bonus amount cannot exceed Tsh 50,000",
    });

    assert.deepEqual(normalizeRiderBonusAmount("1250.555"), {
      amount: 1250.56,
      error: null,
    });
  });
});

test("rider earning estimate includes base and vendor bonus breakdown", () => {
  withRiderEarningEnv("3500", () => {
    const estimate = buildRiderEarningEstimate({
      status: "delivered",
      riderBonusAmount: "1250.555",
      riderBonusNote: "Long route.",
      riderPaidAt: "2026-06-01T08:00:00.000Z",
      riderPaymentNote: "Paid in cash.",
    });

    assert.equal(estimate.amount, 4750.56);
    assert.equal(estimate.baseAmount, 3500);
    assert.equal(estimate.bonusAmount, 1250.56);
    assert.equal(estimate.bonusLimit, getRiderBonusLimit());
    assert.equal(estimate.status, "earned");
    assert.equal(estimate.baseSource, "configured");
    assert.deepEqual(estimate.settlement, {
      status: "paid",
      paidAt: "2026-06-01T08:00:00.000Z",
      note: "Paid in cash.",
      label: "Paid by vendor",
      actionOwner: "vendor",
    });
    assert.deepEqual(estimate.funding, {
      payer: "vendor",
      settlementOwner: "vendor",
      companyLiability: false,
      note: "Rider pay is managed directly between the vendor and their rider.",
    });
    assert.deepEqual(estimate.summary, {
      hasBonus: true,
      lineCount: 2,
      label: "Vendor-managed base + trip bonus",
      releaseCondition: "Delivery completed",
      settlementNote: "Vendor settles this rider pay directly.",
    });
    assert.equal(estimate.lines.length, 2);
    assert.equal(estimate.lines[0].payer, "vendor");
    assert.equal(estimate.lines[1].label, "Vendor trip bonus");
    assert.equal(estimate.lines[1].note, "Long route.");
    assert.equal(estimate.lines[1].payer, "vendor");
  });
});

test("rider earning estimate summarizes pending base-only earnings", () => {
  withRiderEarningEnv("3000", () => {
    const estimate = buildRiderEarningEstimate({
      status: "out_for_delivery",
    });

    assert.equal(estimate.amount, 3000);
    assert.equal(estimate.bonusAmount, 0);
    assert.equal(estimate.status, "pending_delivery");
    assert.deepEqual(estimate.settlement, {
      status: "pending_delivery",
      paidAt: null,
      note: null,
      label: "Pending delivery completion",
      actionOwner: "vendor",
    });
    assert.deepEqual(estimate.summary, {
      hasBonus: false,
      lineCount: 1,
      label: "Vendor-managed base delivery earning",
      releaseCondition: "Complete delivery to unlock earning",
      settlementNote: "Vendor settles this rider pay directly.",
    });
    assert.equal(estimate.lines.length, 1);
  });
});
