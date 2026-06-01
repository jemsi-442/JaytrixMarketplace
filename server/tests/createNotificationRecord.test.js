import assert from "node:assert/strict";
import test from "node:test";
import { Notification } from "../models/index.js";
import { createNotificationRecord } from "../utils/createNotificationRecord.js";

const waitForExternalStatus = async (notificationId) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const notification = await Notification.findByPk(notificationId);
    if (notification?.externalStatus) {
      return notification;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return Notification.findByPk(notificationId);
};

test("createNotificationRecord stores skipped external delivery status", async () => {
  const previous = {
    NOTIFICATION_EXTERNAL_CHANNELS: process.env.NOTIFICATION_EXTERNAL_CHANNELS,
    NOTIFICATION_EXTERNAL_TYPES: process.env.NOTIFICATION_EXTERNAL_TYPES,
    MESSAGING_SETTINGS_SOURCE: process.env.MESSAGING_SETTINGS_SOURCE,
  };

  process.env.NOTIFICATION_EXTERNAL_CHANNELS = "meseji_whatsapp";
  process.env.NOTIFICATION_EXTERNAL_TYPES = "rider_payment_settled";
  process.env.MESSAGING_SETTINGS_SOURCE = "env";

  try {
    const notification = await createNotificationRecord({
      type: "admin_delivery_issue",
      audience: "admin",
      message: "Delivery issue reported",
      phone: "0712345678",
    });

    const updated = await waitForExternalStatus(notification.id);
    assert.equal(updated.externalChannel, "meseji_whatsapp");
    assert.equal(updated.externalStatus, "skipped");
    assert.match(updated.externalError, /not enabled/);
  } finally {
    if (previous.NOTIFICATION_EXTERNAL_CHANNELS === undefined) {
      delete process.env.NOTIFICATION_EXTERNAL_CHANNELS;
    } else {
      process.env.NOTIFICATION_EXTERNAL_CHANNELS = previous.NOTIFICATION_EXTERNAL_CHANNELS;
    }

    if (previous.NOTIFICATION_EXTERNAL_TYPES === undefined) {
      delete process.env.NOTIFICATION_EXTERNAL_TYPES;
    } else {
      process.env.NOTIFICATION_EXTERNAL_TYPES = previous.NOTIFICATION_EXTERNAL_TYPES;
    }

    if (previous.MESSAGING_SETTINGS_SOURCE === undefined) {
      delete process.env.MESSAGING_SETTINGS_SOURCE;
    } else {
      process.env.MESSAGING_SETTINGS_SOURCE = previous.MESSAGING_SETTINGS_SOURCE;
    }
  }
});

test("createNotificationRecord reuses already externally processed duplicates", async () => {
  const previous = {
    NOTIFICATION_EXTERNAL_CHANNELS: process.env.NOTIFICATION_EXTERNAL_CHANNELS,
    NOTIFICATION_EXTERNAL_TYPES: process.env.NOTIFICATION_EXTERNAL_TYPES,
    MESSAGING_SETTINGS_SOURCE: process.env.MESSAGING_SETTINGS_SOURCE,
  };

  process.env.NOTIFICATION_EXTERNAL_CHANNELS = "meseji_whatsapp";
  process.env.NOTIFICATION_EXTERNAL_TYPES = "rider_payment_settled";
  process.env.MESSAGING_SETTINGS_SOURCE = "env";

  try {
    const payload = {
      type: "admin_delivery_issue",
      audience: "admin",
      message: `Duplicate delivery issue test ${Date.now()}`,
      phone: "0712345678",
    };

    const first = await createNotificationRecord(payload);
    const firstUpdated = await waitForExternalStatus(first.id);
    const second = await createNotificationRecord(payload);

    assert.equal(second.id, first.id);
    assert.equal(firstUpdated.externalStatus, "skipped");

    const count = await Notification.count({
      where: {
        type: payload.type,
        audience: payload.audience,
        message: payload.message,
      },
    });
    assert.equal(count, 1);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
