import Notification from "../models/Notification.js";
import { deliverExternalNotification } from "../services/MessagingService.js";
import { enqueueNotificationEvent, publishNotificationEvent } from "./notificationStream.js";

const toPayload = (notification) => ({
  _id: notification.id,
  orderId: notification.orderId,
  type: notification.type,
  audience: notification.audience,
  message: notification.message,
  phone: notification.phone,
  read: Boolean(notification.read),
  status: notification.status || "logged",
  externalChannel: notification.externalChannel || notification.external_channel || null,
  externalStatus: notification.externalStatus || notification.external_status || null,
  externalSentAt: notification.externalSentAt || notification.external_sent_at || null,
  externalError: notification.externalError || notification.external_error || null,
  customerName: notification.customerName || null,
  riderName: notification.riderName || null,
  createdAt: notification.createdAt || notification.created_at || null,
});

export const createNotificationRecord = async ({
  orderId = null,
  type,
  audience = "customer",
  message,
  phone = null,
  read = false,
  customerName = null,
  riderName = null,
  status = "logged",
  userId = null,
}) => {
  const existing = await Notification.findOne({
    where: {
      orderId,
      type,
      audience,
      message,
    },
    order: [["created_at", "DESC"]],
  });

  if (existing && ["sent", "skipped"].includes(existing.externalStatus || existing.external_status)) {
    return existing;
  }

  const notification = await Notification.create({
    orderId,
    type,
    audience,
    message,
    phone,
    read,
    customerName,
    riderName,
    status,
  });

  publishNotificationEvent({
    audience,
    userId,
    notification: toPayload(notification),
  });

  await enqueueNotificationEvent({
    audience,
    userId,
    notificationId: notification.id,
    payload: toPayload(notification),
  });

  deliverExternalNotification({
    orderId,
    type,
    audience,
    message,
    phone,
    userId,
  })
    .then(async (results) => {
      const primary = Array.isArray(results) ? results[0] : null;
      if (!primary) return;

      notification.externalChannel = primary.provider || null;
      notification.externalStatus = primary.skipped ? "skipped" : "sent";
      notification.externalSentAt = primary.skipped ? null : new Date();
      notification.externalError = primary.reason || null;
      await notification.save();
    })
    .catch(async (error) => {
      notification.externalChannel = "meseji_whatsapp";
      notification.externalStatus = "failed";
      notification.externalError = error.message;
      await notification.save().catch(() => {});
      console.error("External notification delivery failed", {
        type,
        audience,
        orderId,
        message: error.message,
      });
    });

  return notification;
};
