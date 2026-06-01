import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverExternalNotification,
  isMesejiSmsConfigured,
  isMesejiWhatsAppConfigured,
  normalizeWhatsAppPhone,
  sendMesejiSmsText,
  sendMesejiWhatsAppText,
} from "../services/MessagingService.js";

const withEnv = async (values, callback) => {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test("normalizes Tanzanian WhatsApp phone numbers for Meseji", () => {
  assert.equal(normalizeWhatsAppPhone("0712 345 678"), "255712345678");
  assert.equal(normalizeWhatsAppPhone("+255 712 345 678"), "255712345678");
  assert.equal(normalizeWhatsAppPhone("712345678"), "255712345678");
});

test("Meseji WhatsApp remains disabled until explicitly configured", async () => {
  await withEnv(
    {
      MESEJI_WHATSAPP_ENABLED: "false",
      MESEJI_API_TOKEN: "replace_with_meseji_api_token",
      MESEJI_WHATSAPP_FROM: "replace_with_meseji_phone_number_id",
      NOTIFICATION_EXTERNAL_CHANNELS: "meseji_whatsapp",
      MESSAGING_SETTINGS_SOURCE: "env",
    },
    async () => {
      assert.equal(isMesejiWhatsAppConfigured(), false);
      const result = await sendMesejiWhatsAppText({
        to: "0712345678",
        message: "Test message",
      });
      assert.equal(result.skipped, true);
      assert.equal(result.provider, "meseji_whatsapp");
    }
  );
});

test("Meseji SMS remains disabled until endpoint and sender are configured", async () => {
  await withEnv(
    {
      MESEJI_SMS_ENABLED: "false",
      MESEJI_API_TOKEN: "test_token",
      MESEJI_SMS_ENDPOINT: "replace_with_meseji_sms_endpoint",
      MESEJI_SMS_SENDER: "Ecommerce",
      NOTIFICATION_EXTERNAL_CHANNELS: "meseji_sms",
      MESSAGING_SETTINGS_SOURCE: "env",
    },
    async () => {
      assert.equal(isMesejiSmsConfigured(), false);
      const result = await sendMesejiSmsText({
        to: "0712345678",
        message: "Test SMS",
      });
      assert.equal(result.skipped, true);
      assert.equal(result.provider, "meseji_sms");
    }
  );
});

test("external notifications are no-op unless Meseji channel is enabled", async () => {
  await withEnv(
    {
      NOTIFICATION_EXTERNAL_CHANNELS: "",
      MESSAGING_SETTINGS_SOURCE: "env",
    },
    async () => {
      const results = await deliverExternalNotification({
        phone: "0712345678",
        message: "Order update",
      });
      assert.deepEqual(results, []);
    }
  );
});

test("external notifications skip types that are not allowlisted", async () => {
  await withEnv(
    {
      NOTIFICATION_EXTERNAL_CHANNELS: "meseji_whatsapp",
      NOTIFICATION_EXTERNAL_TYPES: "rider_payment_settled",
      MESSAGING_SETTINGS_SOURCE: "env",
      MESEJI_WHATSAPP_ENABLED: "true",
      MESEJI_API_TOKEN: "test_token",
      MESEJI_WHATSAPP_FROM: "phone_number_id",
    },
    async () => {
      const results = await deliverExternalNotification({
        type: "admin_delivery_issue",
        phone: "0712345678",
        message: "Order update",
      });
      assert.equal(results.length, 1);
      assert.equal(results[0].skipped, true);
      assert.match(results[0].reason, /not enabled/);
    }
  );
});

test("external notifications can use SMS when Meseji SMS channel is enabled", async () => {
  const originalFetch = global.fetch;
  let requestBody = null;

  global.fetch = async (url, init = {}) => {
    requestBody = JSON.parse(String(init.body || "{}"));
    return new Response(JSON.stringify({ status: true, data: { id: "sms-test" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    await withEnv(
      {
        NOTIFICATION_EXTERNAL_CHANNELS: "meseji_sms",
        NOTIFICATION_EXTERNAL_TYPES: "rider_payment_settled",
        MESSAGING_SETTINGS_SOURCE: "env",
        MESEJI_SMS_ENABLED: "true",
        MESEJI_API_TOKEN: "test_token",
        MESEJI_SMS_ENDPOINT: "https://api.meseji.app/api/v1/sms/messages/text",
        MESEJI_SMS_SENDER: "Ecommerce",
      },
      async () => {
        const results = await deliverExternalNotification({
          type: "rider_payment_settled",
          phone: "0712345678",
          message: "Rider paid",
        });

        assert.equal(results.length, 1);
        assert.equal(results[0].skipped, false);
        assert.equal(results[0].provider, "meseji_sms");
        assert.deepEqual(requestBody, {
          to: "255712345678",
          from: "Ecommerce",
          text: "Rider paid",
        });
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
