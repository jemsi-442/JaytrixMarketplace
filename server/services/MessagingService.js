import { AppSetting } from "../models/index.js";

const DEFAULT_MESEJI_BASE_URL = "https://api.meseji.app";
const SETTINGS = {
  externalChannels: "notifications.external_channels",
  externalTypes: "notifications.external_types",
  mesejiWhatsappEnabled: "meseji.whatsapp_enabled",
  mesejiSmsEnabled: "meseji.sms_enabled",
};

const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const isEnabled = (value) => String(value || "").toLowerCase() === "true";

const isConfiguredValue = (value) => {
  const normalized = String(value || "").trim();
  return normalized && !normalized.toLowerCase().startsWith("replace_with");
};

const parseList = (value = "") =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const getMesejiConfig = () => ({
  enabled: isEnabled(process.env.MESEJI_WHATSAPP_ENABLED),
  baseUrl: trimSlash(process.env.MESEJI_BASE_URL || DEFAULT_MESEJI_BASE_URL),
  token: String(process.env.MESEJI_API_TOKEN || "").trim(),
  from: String(process.env.MESEJI_WHATSAPP_FROM || "").trim(),
  smsEnabled: isEnabled(process.env.MESEJI_SMS_ENABLED),
  smsBaseUrl: trimSlash(process.env.MESEJI_TZ_BASE_URL || "https://meseji.co.tz/api/v1"),
  smsApiKey: String(process.env.MESEJI_TZ_API_KEY || "").trim(),
  smsSenderId: String(process.env.MESEJI_SMS_SENDER_ID || process.env.APP_NAME || "").trim(),
});

const getSettingValue = async (key, fallback = "") => {
  if (String(process.env.MESSAGING_SETTINGS_SOURCE || "").toLowerCase() === "env") {
    return fallback;
  }

  const setting = await AppSetting.findByPk(key).catch(() => null);
  return setting?.value ?? fallback;
};

export const getMessagingRuntimeConfig = async () => {
  const externalChannels = await getSettingValue(
    SETTINGS.externalChannels,
    process.env.NOTIFICATION_EXTERNAL_CHANNELS || ""
  );
  const externalTypes = await getSettingValue(
    SETTINGS.externalTypes,
    process.env.NOTIFICATION_EXTERNAL_TYPES || ""
  );
  const mesejiWhatsappEnabled = await getSettingValue(
    SETTINGS.mesejiWhatsappEnabled,
    process.env.MESEJI_WHATSAPP_ENABLED || "false"
  );
  const mesejiSmsEnabled = await getSettingValue(
    SETTINGS.mesejiSmsEnabled,
    process.env.MESEJI_SMS_ENABLED || "false"
  );

  return {
    externalChannels: parseList(externalChannels),
    externalTypes: parseList(externalTypes),
    mesejiWhatsappEnabled: isEnabled(mesejiWhatsappEnabled),
    mesejiSmsEnabled: isEnabled(mesejiSmsEnabled),
    mesejiConfigured: isMesejiWhatsAppConfigured({
      enabledOverride: isEnabled(mesejiWhatsappEnabled),
    }),
    mesejiSmsConfigured: isMesejiSmsConfigured({
      enabledOverride: isEnabled(mesejiSmsEnabled),
    }),
  };
};

export const updateMessagingRuntimeConfig = async ({
  externalChannels,
  externalTypes,
  mesejiWhatsappEnabled,
  mesejiSmsEnabled,
}) => {
  const normalizedChannels = Array.isArray(externalChannels) ? externalChannels.join(",") : String(externalChannels || "");
  const normalizedTypes = Array.isArray(externalTypes) ? externalTypes.join(",") : String(externalTypes || "");
  const normalizedWhatsappEnabled = isEnabled(mesejiWhatsappEnabled) ? "true" : "false";
  const normalizedSmsEnabled = isEnabled(mesejiSmsEnabled) ? "true" : "false";

  await Promise.all([
    AppSetting.upsert({ key: SETTINGS.externalChannels, value: normalizedChannels }),
    AppSetting.upsert({ key: SETTINGS.externalTypes, value: normalizedTypes }),
    AppSetting.upsert({ key: SETTINGS.mesejiWhatsappEnabled, value: normalizedWhatsappEnabled }),
    AppSetting.upsert({ key: SETTINGS.mesejiSmsEnabled, value: normalizedSmsEnabled }),
  ]);

  return getMessagingRuntimeConfig();
};

export const isMesejiWhatsAppConfigured = ({ enabledOverride = null } = {}) => {
  const config = getMesejiConfig();
  const enabled = enabledOverride === null ? config.enabled : Boolean(enabledOverride);
  return enabled && isConfiguredValue(config.token) && isConfiguredValue(config.from);
};

export const isMesejiSmsConfigured = ({ enabledOverride = null } = {}) => {
  const config = getMesejiConfig();
  const enabled = enabledOverride === null ? config.smsEnabled : Boolean(enabledOverride);
  return (
    enabled &&
    isConfiguredValue(config.smsApiKey) &&
    isConfiguredValue(config.smsBaseUrl) &&
    isConfiguredValue(config.smsSenderId)
  );
};

export const normalizeWhatsAppPhone = (phone = "") => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;

  return digits;
};

export const sendMesejiWhatsAppText = async ({ to, message, enabledOverride = null }) => {
  const config = getMesejiConfig();

  if (!isMesejiWhatsAppConfigured({ enabledOverride })) {
    return {
      skipped: true,
      provider: "meseji_whatsapp",
      reason: "Meseji WhatsApp is not configured",
    };
  }

  const normalizedTo = normalizeWhatsAppPhone(to);
  const text = String(message || "").trim();

  if (!normalizedTo || !text) {
    return {
      skipped: true,
      provider: "meseji_whatsapp",
      reason: "Missing recipient or message",
    };
  }

  const response = await fetch(`${config.baseUrl}/api/v1/whatsapp/messages/text`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: normalizedTo,
      from: config.from,
      text,
    }),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const error = new Error(payload?.message || `Meseji WhatsApp failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    error.provider = "meseji_whatsapp";
    throw error;
  }

  return {
    skipped: false,
    provider: "meseji_whatsapp",
    payload,
  };
};

export const sendMesejiSmsText = async ({ to, message, enabledOverride = null }) => {
  const config = getMesejiConfig();

  if (!isMesejiSmsConfigured({ enabledOverride })) {
    return {
      skipped: true,
      provider: "meseji_sms",
      reason: "Meseji SMS is not configured",
    };
  }

  const normalizedTo = normalizeWhatsAppPhone(to);
  const text = String(message || "").trim();

  if (!normalizedTo || !text) {
    return {
      skipped: true,
      provider: "meseji_sms",
      reason: "Missing recipient or message",
    };
  }

  const response = await fetch(`${config.smsBaseUrl}/sms/send`, {
    method: "POST",
    headers: {
      "x-api-key": config.smsApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_id: config.smsSenderId,
      message: text,
      contacts: normalizedTo,
    }),
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const error = new Error(payload?.message || `Meseji SMS failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    error.provider = "meseji_sms";
    throw error;
  }

  return {
    skipped: false,
    provider: "meseji_sms",
    payload,
  };
};

export const selectPrimaryExternalResult = (results = []) => {
  if (!Array.isArray(results) || !results.length) {
    return null;
  }

  return (
    results.find((result) => result && !result.skipped && !result.failed) ||
    results.find((result) => result && result.failed) ||
    results[0]
  );
};

export const deliverExternalNotification = async (notificationInput = {}) => {
  const runtimeConfig = await getMessagingRuntimeConfig();
  const channels = runtimeConfig.externalChannels;
  const allowedTypes = runtimeConfig.externalTypes;
  const type = String(notificationInput.type || "").trim().toLowerCase();

  const enabledChannels = channels.filter((channel) =>
    ["meseji_whatsapp", "meseji_sms"].includes(channel)
  );

  if (!enabledChannels.length) {
    return [];
  }

  if (!allowedTypes.includes("*") && (!type || !allowedTypes.includes(type))) {
    return enabledChannels.map((channel) => ({
      skipped: true,
      provider: channel,
      reason: "Notification type is not enabled for external delivery",
    }));
  }

  const deliveries = [];

  if (enabledChannels.includes("meseji_whatsapp")) {
    deliveries.push(
      sendMesejiWhatsAppText({
        to: notificationInput.phone,
        message: notificationInput.message,
        enabledOverride: runtimeConfig.mesejiWhatsappEnabled,
      })
    );
  }

  if (enabledChannels.includes("meseji_sms")) {
    deliveries.push(
      sendMesejiSmsText({
        to: notificationInput.phone,
        message: notificationInput.message,
        enabledOverride: runtimeConfig.mesejiSmsEnabled,
      })
    );
  }

  return Promise.all(
    deliveries.map((delivery) =>
      delivery.catch((error) => ({
        failed: true,
        skipped: false,
        provider: error.provider || "meseji",
        reason: error.message || "External delivery failed",
        payload: error.payload || null,
      }))
    )
  );
};

export const retryExternalNotification = async (notification) => {
  if (!notification) {
    return null;
  }

  return deliverExternalNotification({
    orderId: notification.orderId,
    type: notification.type,
    audience: notification.audience,
    message: notification.message,
    phone: notification.phone,
  });
};

export default {
  deliverExternalNotification,
  isMesejiSmsConfigured,
  isMesejiWhatsAppConfigured,
  normalizeWhatsAppPhone,
  retryExternalNotification,
  selectPrimaryExternalResult,
  sendMesejiSmsText,
  sendMesejiWhatsAppText,
};
