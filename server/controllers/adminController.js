import { Op } from "sequelize";
import { AuditLog, Order, Notification, User, Rider } from "../models/index.js";
import { createNotificationRecord } from "../utils/createNotificationRecord.js";
import {
  getMessagingRuntimeConfig,
  retryExternalNotification,
  selectPrimaryExternalResult,
  sendMesejiSmsText,
  sendMesejiWhatsAppText,
  updateMessagingRuntimeConfig,
} from "../services/MessagingService.js";
import { serializeOrder } from "../utils/serializers.js";

// GET /admin/audit?status=&rider=&date=
export const getAuditLogs = async (req, res) => {
  try {
    const { status, rider, date } = req.query;
    const where = {};

    if (status) where.status = status;
    if (rider) where.riderId = rider;
    if (date) {
      const day = new Date(date);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      where.createdAt = { [Op.gte]: day, [Op.lt]: nextDay };
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: Rider, as: "rider", attributes: ["id", "name"] },
      ],
    });

    const notifications = await Notification.findAll({
      where: { audience: "admin" },
    });

    const auditEvents = await AuditLog.findAll({
      where: {
        type: ["notification", "payment"],
      },
      order: [["created_at", "DESC"]],
      limit: 200,
    });

    const logs = [];

    orders.forEach((row) => {
      const o = serializeOrder(row);
      logs.push({
        _id: o._id,
        orderId: o._id,
        userName: o.user?.name,
        riderName: o.delivery?.rider?.name,
        type: "status",
        message: `Order status: ${o.status}`,
        createdAt: o.updatedAt || o.createdAt,
      });
    });

    notifications.forEach((nRow) => {
      const n = typeof nRow.toJSON === "function" ? nRow.toJSON() : nRow;
      logs.push({
        _id: n.id,
        source: "notification_record",
        orderId: n.orderId,
        userName: n.customerName,
        riderName: n.riderName || null,
        type: "notification",
        notificationType: n.type,
        audience: n.audience,
        message: n.message,
        status: n.status || "logged",
        read: Boolean(n.read),
        externalChannel: n.externalChannel || null,
        externalStatus: n.externalStatus || null,
        externalSentAt: n.externalSentAt || null,
        externalError: n.externalError || null,
        createdAt: n.createdAt,
      });
    });

    auditEvents.forEach((eventRow) => {
      const event = typeof eventRow.toJSON === "function" ? eventRow.toJSON() : eventRow;
      logs.push({
        _id: `audit-${event.id}`,
        source: "audit_log",
        orderId: event.orderId || null,
        userName: event.userName || null,
        riderName: event.riderName || null,
        type: event.type,
        action: event.action,
        notificationType: event.action,
        audience: event.meta?.audience || null,
        message: event.message,
        status: event.meta?.skipped ? "skipped" : event.meta?.status || "logged",
        read: true,
        meta: event.meta || {},
        createdAt: event.createdAt || event.created_at || null,
      });
    });

    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching audit logs" });
  }
};

// POST /admin/notifications/send
export const sendNotification = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const notification = await createNotificationRecord({
      orderId,
      audience: "customer",
      customerName: order.user?.name || null,
      type: "SMS",
      message: `Your order ${String(order.id).slice(-5)} is ${order.status}`,
      status: "sent",
      userId: order.user?.id || null,
    });

    res.json({ message: "Notification sent", notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send notification" });
  }
};

export const getMessagingSettings = async (req, res) => {
  try {
    const config = await getMessagingRuntimeConfig();
    return res.json({
      data: {
        ...config,
        providers: {
          mesejiWhatsapp: {
            configured: config.mesejiConfigured,
            enabled: config.mesejiWhatsappEnabled,
          },
          mesejiSms: {
            configured: config.mesejiSmsConfigured,
            enabled: config.mesejiSmsEnabled,
          },
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch messaging settings" });
  }
};

export const updateMessagingSettings = async (req, res) => {
  try {
    const config = await updateMessagingRuntimeConfig({
      externalChannels: req.body?.externalChannels,
      externalTypes: req.body?.externalTypes,
      mesejiWhatsappEnabled: req.body?.mesejiWhatsappEnabled,
      mesejiSmsEnabled: req.body?.mesejiSmsEnabled,
    });

    await AuditLog.create({
      userId: req.user?._id || null,
      userName: req.user?.name || null,
      type: "notification",
      action: "messaging_settings_updated",
      message: "Admin updated external messaging settings",
      meta: {
        externalChannels: config.externalChannels,
        externalTypes: config.externalTypes,
        mesejiWhatsappEnabled: config.mesejiWhatsappEnabled,
        mesejiSmsEnabled: config.mesejiSmsEnabled,
      },
    });

    return res.json({
      message: "Messaging settings updated",
      data: {
        ...config,
        providers: {
          mesejiWhatsapp: {
            configured: config.mesejiConfigured,
            enabled: config.mesejiWhatsappEnabled,
          },
          mesejiSms: {
            configured: config.mesejiSmsConfigured,
            enabled: config.mesejiSmsEnabled,
          },
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update messaging settings" });
  }
};

export const sendMessagingTest = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").trim();
    const message = String(req.body?.message || "Test message from marketplace notifications.").trim();
    const channel = String(req.body?.channel || "meseji_whatsapp").trim().toLowerCase();

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!["meseji_whatsapp", "meseji_sms"].includes(channel)) {
      return res.status(400).json({ message: "Unsupported messaging test channel" });
    }

    const config = await getMessagingRuntimeConfig();
    const result =
      channel === "meseji_sms"
        ? await sendMesejiSmsText({
            to: phone,
            message,
            enabledOverride: config.mesejiSmsEnabled,
          })
        : await sendMesejiWhatsAppText({
            to: phone,
            message,
            enabledOverride: config.mesejiWhatsappEnabled,
          });

    await AuditLog.create({
      userId: req.user?._id || null,
      userName: req.user?.name || null,
      type: "notification",
      action: "messaging_test_sent",
      message: result.skipped ? "Admin test message was skipped" : "Admin sent a test external message",
      meta: {
        provider: result.provider,
        channel,
        skipped: Boolean(result.skipped),
        reason: result.reason || null,
        phone,
      },
    });

    return res.json({
      message: result.skipped ? "Test message skipped" : "Test message sent",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Failed to send test message",
      data: err.payload || null,
    });
  }
};

export const retryNotificationDelivery = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.externalStatus === "sent") {
      return res.status(400).json({ message: "Notification has already been sent externally" });
    }

    let results = null;

    try {
      results = await retryExternalNotification(notification);
    } catch (deliveryError) {
      notification.externalChannel = "meseji_whatsapp";
      notification.externalStatus = "failed";
      notification.externalError = deliveryError.message || "External delivery failed";
      notification.externalSentAt = null;
      await notification.save();
      throw deliveryError;
    }

    const primary = selectPrimaryExternalResult(results);

    if (!primary) {
      notification.externalChannel = null;
      notification.externalStatus = "skipped";
      notification.externalError = "No external channel is enabled";
      notification.externalSentAt = null;
    } else {
      notification.externalChannel = primary.provider || null;
      notification.externalStatus = primary.failed ? "failed" : primary.skipped ? "skipped" : "sent";
      notification.externalError = primary.reason || null;
      notification.externalSentAt = primary.skipped || primary.failed ? null : new Date();
    }

    await notification.save();

    await AuditLog.create({
      userId: req.user?._id || null,
      userName: req.user?.name || null,
      orderId: notification.orderId || null,
      type: "notification",
      action: "external_notification_retried",
      message: `Admin retried external delivery for notification ${notification.id}`,
      meta: {
        notificationId: notification.id,
        externalChannel: notification.externalChannel,
        externalStatus: notification.externalStatus,
        externalError: notification.externalError,
      },
    });

    return res.json({
      message: notification.externalStatus === "sent" ? "External notification sent" : "External notification skipped",
      data: notification,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Failed to retry external notification",
      data: err.payload || null,
    });
  }
};
