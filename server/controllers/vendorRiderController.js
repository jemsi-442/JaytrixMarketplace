import asyncHandler from "../middleware/asyncHandler.js";
import { AuditLog, Order, Rider, User } from "../models/index.js";
import { createNotificationRecord } from "../utils/createNotificationRecord.js";
import { buildRiderEarningEstimate } from "../utils/riderEarnings.js";
import { serializeUser } from "../utils/serializers.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const normalizePhone = (value = "") => String(value).trim();

const serializeVendorRider = (rider, user = rider?.user) => {
  if (!rider) {
    return null;
  }

  return {
    ...rider.toJSON(),
    user: user ? serializeUser(user) : null,
  };
};

export const getVendorRiders = asyncHandler(async (req, res) => {
  const riders = await Rider.findAll({
    where: { vendorId: req.user._id },
    include: [{ model: User, as: "user", required: false }],
    order: [["created_at", "DESC"]],
  });

  return res.json({
    data: riders.map((rider) => serializeVendorRider(rider, rider.user)),
  });
});

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round((amount + 1e-9) * 100) / 100 : 0;
};

const buildEmptyRiderEarnings = (rider) => ({
  rider: serializeVendorRider(rider, rider.user),
  completedDeliveries: 0,
  activeDeliveries: 0,
  pendingDeliveries: 0,
  earnedTotal: 0,
  paidTotal: 0,
  unpaidTotal: 0,
  pendingTotal: 0,
  projectedTotal: 0,
  baseTotal: 0,
  bonusTotal: 0,
  lastDeliveredAt: null,
  recentOrders: [],
});

const buildVendorRiderEarningsReport = async (vendorId) => {
  const riders = await Rider.findAll({
    where: { vendorId },
    include: [{ model: User, as: "user", required: false }],
    order: [["name", "ASC"]],
  });

  const riderIds = riders.map((rider) => rider.id);
  const reportByRider = new Map(riders.map((rider) => [Number(rider.id), buildEmptyRiderEarnings(rider)]));

  if (riderIds.length) {
    const orders = await Order.findAll({
      where: { riderId: riderIds },
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"], required: false }],
      order: [["created_at", "DESC"]],
    });

    for (const order of orders) {
      const riderReport = reportByRider.get(Number(order.riderId));
      if (!riderReport) continue;

      const plainOrder = order.get({ plain: true });
      const earning = buildRiderEarningEstimate(plainOrder);
      const active = ["paid", "out_for_delivery"].includes(order.status);
      const delivered = order.status === "delivered";
      const cancelled = ["cancelled", "refunded"].includes(order.status);
      const amount = cancelled ? 0 : earning.amount;

      if (delivered) {
        riderReport.completedDeliveries += 1;
        riderReport.earnedTotal = toMoney(riderReport.earnedTotal + amount);
        if (order.riderPaidAt) {
          riderReport.paidTotal = toMoney(riderReport.paidTotal + amount);
        } else {
          riderReport.unpaidTotal = toMoney(riderReport.unpaidTotal + amount);
        }
        riderReport.lastDeliveredAt = riderReport.lastDeliveredAt || order.deliveredAt || order.completedAt || null;
      } else if (active) {
        riderReport.activeDeliveries += 1;
        riderReport.pendingTotal = toMoney(riderReport.pendingTotal + amount);
      } else if (!cancelled) {
        riderReport.pendingDeliveries += 1;
      }

      if (!cancelled) {
        riderReport.projectedTotal = toMoney(riderReport.projectedTotal + amount);
        riderReport.baseTotal = toMoney(riderReport.baseTotal + earning.baseAmount);
        riderReport.bonusTotal = toMoney(riderReport.bonusTotal + earning.bonusAmount);
      }

      if (riderReport.recentOrders.length < 5) {
        riderReport.recentOrders.push({
          id: order.id,
          status: order.status,
          customerName: plainOrder.user?.name || "Customer",
          deliveredAt: order.deliveredAt || null,
          assignedAt: order.assignedAt || null,
          riderPaidAt: order.riderPaidAt || null,
          riderPaymentNote: order.riderPaymentNote || null,
          earning,
        });
      }
    }
  }

  const items = Array.from(reportByRider.values());
  const summary = items.reduce(
    (total, item) => ({
      riders: total.riders + 1,
      completedDeliveries: total.completedDeliveries + item.completedDeliveries,
      activeDeliveries: total.activeDeliveries + item.activeDeliveries,
      earnedTotal: toMoney(total.earnedTotal + item.earnedTotal),
      paidTotal: toMoney(total.paidTotal + item.paidTotal),
      unpaidTotal: toMoney(total.unpaidTotal + item.unpaidTotal),
      pendingTotal: toMoney(total.pendingTotal + item.pendingTotal),
      projectedTotal: toMoney(total.projectedTotal + item.projectedTotal),
      bonusTotal: toMoney(total.bonusTotal + item.bonusTotal),
    }),
    {
      riders: 0,
      completedDeliveries: 0,
      activeDeliveries: 0,
      earnedTotal: 0,
      paidTotal: 0,
      unpaidTotal: 0,
      pendingTotal: 0,
      projectedTotal: 0,
      bonusTotal: 0,
    }
  );

  return {
    summary,
    items,
    settlement: {
      payer: "vendor",
      companyLiability: false,
      note: "Rider earnings are managed and settled directly by the vendor.",
    },
  };
};

export const getVendorRiderEarnings = asyncHandler(async (req, res) => {
  const report = await buildVendorRiderEarningsReport(req.user._id);

  return res.json({
    data: report,
  });
});

const riderEarningsExportHeaders = [
  "rider_id",
  "rider_name",
  "phone",
  "completed_deliveries",
  "active_deliveries",
  "pending_deliveries",
  "earned_total",
  "paid_total",
  "unpaid_total",
  "pending_total",
  "projected_total",
  "base_total",
  "bonus_total",
  "last_delivered_at",
  "settlement_owner",
  "company_liability",
];

const escapeCsvValue = (value) => {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (!/[",\n]/.test(normalized)) return normalized;
  return "\"" + normalized.replace(/\"/g, "\"\"") + "\"";
};

export const exportVendorRiderEarningsCsv = asyncHandler(async (req, res) => {
  const report = await buildVendorRiderEarningsReport(req.user._id);
  const rows = report.items.map((item) =>
    [
      item.rider?.id || "",
      item.rider?.name || "",
      item.rider?.phone || "",
      item.completedDeliveries,
      item.activeDeliveries,
      item.pendingDeliveries,
      Number(item.earnedTotal || 0).toFixed(2),
      Number(item.paidTotal || 0).toFixed(2),
      Number(item.unpaidTotal || 0).toFixed(2),
      Number(item.pendingTotal || 0).toFixed(2),
      Number(item.projectedTotal || 0).toFixed(2),
      Number(item.baseTotal || 0).toFixed(2),
      Number(item.bonusTotal || 0).toFixed(2),
      item.lastDeliveredAt || "",
      report.settlement.payer,
      report.settlement.companyLiability ? "yes" : "no",
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  const filename = `vendor-rider-pay-sheet-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send("\uFEFF" + [riderEarningsExportHeaders.join(","), ...rows].join("\n"));
});

export const updateVendorRiderOrderSettlement = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.orderId, {
    include: [{ model: Rider, as: "rider", required: false }],
  });

  if (!order?.rider || Number(order.rider.vendorId) !== Number(req.user._id)) {
    return res.status(404).json({ message: "Rider order not found for your store" });
  }

  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Only completed deliveries can be marked as rider paid" });
  }

  const paid = req.body?.paid !== false;
  const paymentNote = normalizeName(req.body?.paymentNote || req.body?.note || "");

  if (paymentNote && paymentNote.length > 240) {
    return res.status(400).json({ message: "Payment note must be 240 characters or less" });
  }

  order.riderPaidAt = paid ? order.riderPaidAt || new Date() : null;
  order.riderPaymentNote = paymentNote || null;
  await order.save();
  const earningEstimate = buildRiderEarningEstimate(order.get({ plain: true }));

  await AuditLog.create({
    orderId: order.id,
    userId: req.user._id,
    riderId: order.riderId || null,
    userName: req.user?.name || null,
    riderName: order.rider?.name || null,
    type: "delivery",
    action: paid ? "vendor_rider_payment_marked_paid" : "vendor_rider_payment_marked_unpaid",
    message: paid
      ? `Vendor marked rider payment for order ${order.id} as paid`
      : `Vendor marked rider payment for order ${order.id} as unpaid`,
    meta: {
      vendorId: req.user._id,
      riderId: order.riderId || null,
      riderPaidAt: order.riderPaidAt,
      paymentNote,
    },
  });

  await createNotificationRecord({
    orderId: order.id,
    type: paid ? "rider_payment_settled" : "rider_payment_reopened",
    audience: "rider",
    userId: order.rider?.userId || null,
    message: paid
      ? `Your rider payment for order #${order.id} was marked paid: Tsh ${earningEstimate.amount.toLocaleString()}.`
      : `Your rider payment for order #${order.id} was marked unpaid again by the vendor.`,
    phone: order.rider?.phone || null,
    riderName: order.rider?.name || null,
    status: "logged",
  });

  const report = await buildVendorRiderEarningsReport(req.user._id);

  return res.json({
    message: paid ? "Rider payment marked as paid" : "Rider payment marked as unpaid",
    data: report,
  });
});

export const createVendorRider = asyncHandler(async (req, res) => {
  const name = normalizeName(req.body?.name || "");
  const email = normalizeEmail(req.body?.email || "");
  const phone = normalizePhone(req.body?.phone || "");
  const password = String(req.body?.password || "");

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  if (phone.length < 6) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const result = await User.sequelize.transaction(async (transaction) => {
    const riderUser = await User.create(
      {
        name,
        email,
        phone,
        password,
        role: "rider",
        active: true,
      },
      { transaction }
    );

    const rider = await Rider.create(
      {
        userId: riderUser.id,
        vendorId: req.user._id,
        name,
        phone,
        available: true,
        isActive: true,
      },
      { transaction }
    );

    return { riderUser, rider };
  });

  return res.status(201).json({
    message: "Vendor rider created successfully",
    data: serializeVendorRider(result.rider, result.riderUser),
  });
});

export const updateVendorRiderStatus = asyncHandler(async (req, res) => {
  const rider = await Rider.findOne({
    where: {
      id: req.params.id,
      vendorId: req.user._id,
    },
  });

  if (!rider) {
    return res.status(404).json({ message: "Rider not found" });
  }

  if (typeof req.body?.isActive === "boolean") {
    rider.isActive = req.body.isActive;
  }

  if (typeof req.body?.available === "boolean") {
    rider.available = req.body.available;
  }

  await rider.save();

  return res.json({
    message: "Vendor rider status updated successfully",
    data: rider.toJSON(),
  });
});

export const resetVendorRiderPassword = asyncHandler(async (req, res) => {
  const password = String(req.body?.password || "");

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const rider = await Rider.findOne({
    where: {
      id: req.params.id,
      vendorId: req.user._id,
    },
    include: [{ model: User, as: "user", required: false }],
  });

  if (!rider?.user) {
    return res.status(404).json({ message: "Rider not found" });
  }

  rider.user.password = password;
  await rider.user.save();

  return res.json({
    message: "Vendor rider password reset successfully",
    data: serializeVendorRider(rider, rider.user),
  });
});
