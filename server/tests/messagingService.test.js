import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverExternalNotification,
  getMesejiSmsUserStats,
  isMesejiSmsConfigured,
  isMesejiWhatsAppConfigured,
  normalizeMesejiSmsStats,
  normalizeWhatsAppPhone,
  selectPrimaryExternalResult,
  sendMesejiSmsText,
  sendMesejiWhatsAppText,
} from "../services/MessagingService.js";

const recommendedExternalTypes = [
  "customer_payment_pending",
  "customer_payment_completed",
  "customer_payment_issue",
  "customer_order_status",
  "customer_delivery_issue_update",
  "rider_payment_settled",
  "rider_payment_reopened",
  "rider_bonus_updated",
].join(",");

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

test("Meseji SMS remains disabled until API key and sender are configured", async () => {
  await withEnv(
    {
      MESEJI_SMS_ENABLED: "false",
      MESEJI_TZ_API_KEY: "replace_with_meseji_tz_api_key",
      MESEJI_TZ_BASE_URL: "https://meseji.co.tz/api/v1",
      MESEJI_SMS_SENDER_ID: "Ecommerce",
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
  let requestUrl = null;
  let requestHeaders = null;
  let requestBody = null;

  global.fetch = async (url, init = {}) => {
    requestUrl = String(url);
    requestHeaders = init.headers || {};
    requestBody = JSON.parse(String(init.body || "{}"));
    return new Response(JSON.stringify({ status: "queued", batch_id: "sms-test" }), {
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
        MESEJI_TZ_API_KEY: "zs_test_key",
        MESEJI_TZ_BASE_URL: "https://meseji.co.tz/api/v1",
        MESEJI_SMS_SENDER_ID: "MESEJI",
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
        assert.equal(requestUrl, "https://meseji.co.tz/api/v1/sms/send");
        assert.equal(requestHeaders["x-api-key"], "zs_test_key");
        assert.deepEqual(requestBody, {
          sender_id: "MESEJI",
          message: "Rider paid",
          contacts: "255712345678",
        });
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("recommended SMS allowlist includes customer order and payment updates", async () => {
  const originalFetch = global.fetch;
  let requestBody = null;

  global.fetch = async (url, init = {}) => {
    requestBody = JSON.parse(String(init.body || "{}"));
    return new Response(JSON.stringify({ status: "success", batch_id: "allowlist-test" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    await withEnv(
      {
        NOTIFICATION_EXTERNAL_CHANNELS: "meseji_sms",
        NOTIFICATION_EXTERNAL_TYPES: recommendedExternalTypes,
        MESSAGING_SETTINGS_SOURCE: "env",
        MESEJI_SMS_ENABLED: "true",
        MESEJI_TZ_API_KEY: "zs_test_key",
        MESEJI_TZ_BASE_URL: "https://meseji.co.tz/api/v1",
        MESEJI_SMS_SENDER_ID: "MESEJI",
      },
      async () => {
        const results = await deliverExternalNotification({
          type: "customer_order_status",
          phone: "0683186987",
          message: "Your order is now out for delivery.",
        });

        assert.equal(results.length, 1);
        assert.equal(results[0].provider, "meseji_sms");
        assert.equal(results[0].skipped, false);
        assert.equal(requestBody.contacts, "255683186987");
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("Meseji SMS user stats use the documented account stats endpoint", async () => {
  const originalFetch = global.fetch;
  let requestUrl = null;
  let requestHeaders = null;

  global.fetch = async (url, init = {}) => {
    requestUrl = String(url);
    requestHeaders = init.headers || {};
    return new Response(
      JSON.stringify({
        total_messages_sent: 12,
        successful_deliveries: 11,
        failed_deliveries: 1,
        success_rate: 91.7,
        balance: 5000,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  try {
    await withEnv(
      {
        MESEJI_TZ_API_KEY: "zs_test_key",
        MESEJI_TZ_BASE_URL: "https://meseji.co.tz/api/v1",
      },
      async () => {
        const result = await getMesejiSmsUserStats();

        assert.equal(result.skipped, false);
        assert.equal(result.provider, "meseji_sms");
        assert.equal(requestUrl, "https://meseji.co.tz/api/v1/sms/user-stats");
        assert.equal(requestHeaders["x-api-key"], "zs_test_key");
        assert.equal(result.payload.balance, 5000);
        assert.equal(result.stats.balance, 5000);
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("normalizes documented and live Meseji SMS stats payload shapes", () => {
  assert.deepEqual(
    normalizeMesejiSmsStats({
      total_messages_sent: 1523,
      successful_deliveries: 1489,
      failed_deliveries: 34,
      success_rate: 97.8,
      balance: 5000,
    }),
    {
      balance: 5000,
      successRate: 97.8,
      totalSent: 1523,
      successfulDeliveries: 1489,
      failedDeliveries: 34,
      rate: null,
    }
  );

  assert.deepEqual(
    normalizeMesejiSmsStats({
      summary: {
        total_sent: 1,
        total_delivered: 1,
        total_failed: 0,
        success_rate: "100.00%",
        balance: 65.66,
        rate: 15,
      },
    }),
    {
      balance: 65.66,
      successRate: "100.00%",
      totalSent: 1,
      successfulDeliveries: 1,
      failedDeliveries: 0,
      rate: 15,
    }
  );
});

test("primary external result prefers delivered SMS over skipped WhatsApp", () => {
  const primary = selectPrimaryExternalResult([
    {
      skipped: true,
      provider: "meseji_whatsapp",
      reason: "Meseji WhatsApp is not configured",
    },
    {
      skipped: false,
      provider: "meseji_sms",
      payload: { batch_id: "batch_abc123" },
    },
  ]);

  assert.equal(primary.provider, "meseji_sms");
  assert.equal(primary.skipped, false);
});
