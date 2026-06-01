import { AppSetting } from "../models/index.js";

const DEFAULT_MESEJI_BASE_URL = "https://api.meseji.app";
const SETTINGS = {
  externalChannels: "notifications.external_channels",
  externalTypes: "notifications.external_types",
  mesejiWhatsappEnabled: "meseji.whatsapp_enabled",
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

  return {
    externalChannels: parseList(externalChannels),
    externalTypes: parseList(externalTypes),
    mesejiWhatsappEnabled: isEnabled(mesejiWhatsappEnabled),
    mesejiConfigured: isMesejiWhatsAppConfigured({
      enabledOverride: isEnabled(mesejiWhatsappEnabled),
    }),
  };
};

export const updateMessagingRuntimeConfig = async ({
  externalChannels,
  externalTypes,
  mesejiWhatsappEnabled,
}) => {
  const normalizedChannels = Array.isArray(externalChannels) ? externalChannels.join(",") : String(externalChannels || "");
  const normalizedTypes = Array.isArray(externalTypes) ? externalTypes.join(",") : String(externalTypes || "");
  const normalizedEnabled = isEnabled(mesejiWhatsappEnabled) ? "true" : "false";

  await Promise.all([
    AppSetting.upsert({ key: SETTINGS.externalChannels, value: normalizedChannels }),
    AppSetting.upsert({ key: SETTINGS.externalTypes, value: normalizedTypes }),
    AppSetting.upsert({ key: SETTINGS.mesejiWhatsappEnabled, value: normalizedEnabled }),
  ]);

  return getMessagingRuntimeConfig();
};

export const isMesejiWhatsAppConfigured = ({ enabledOverride = null } = {}) => {
  const config = getMesejiConfig();
  const enabled = enabledOverride === null ? config.enabled : Boolean(enabledOverride);
  return enabled && isConfiguredValue(config.token) && isConfiguredValue(config.from);
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
    throw error;
  }

  return {
    skipped: false,
    provider: "meseji_whatsapp",
    payload,
  };
};

export const deliverExternalNotification = async (notificationInput = {}) => {
  const runtimeConfig = await getMessagingRuntimeConfig();
  const channels = runtimeConfig.externalChannels;
  const allowedTypes = runtimeConfig.externalTypes;
  const type = String(notificationInput.type || "").trim().toLowerCase();

  if (!channels.includes("meseji_whatsapp")) {
    return [];
  }

  if (!allowedTypes.includes("*") && (!type || !allowedTypes.includes(type))) {
    return [
      {
        skipped: true,
        provider: "meseji_whatsapp",
        reason: "Notification type is not enabled for external delivery",
      },
    ];
  }

  const result = await sendMesejiWhatsAppText({
    to: notificationInput.phone,
    message: notificationInput.message,
    enabledOverride: runtimeConfig.mesejiWhatsappEnabled,
  });

  return [result];
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
  isMesejiWhatsAppConfigured,
  normalizeWhatsAppPhone,
  retryExternalNotification,
  sendMesejiWhatsAppText,
};
