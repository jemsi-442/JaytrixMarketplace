import { useCallback, useRef } from "react";
import useNotificationStream from "./useNotificationStream";
import useToast from "./useToast";

const RECENT_NOTIFICATION_LIMIT = 40;
const FEEDBACK_COOLDOWN_MS = 1200;

const getNotificationKey = (notification = {}) => {
  const id = notification.id || notification._id;
  if (id) {
    return `id:${id}`;
  }

  return [
    notification.audience,
    notification.type,
    notification.orderId,
    notification.createdAt,
    notification.message,
  ]
    .filter(Boolean)
    .join(":");
};

export default function useNotificationAlerts({
  enabled = true,
  mode = "customer",
  soundEnabled = true,
  vibrationEnabled = true,
} = {}) {
  const toast = useToast();
  const recentNotificationKeys = useRef([]);
  const lastFeedbackAt = useRef(0);

  const handleNotification = useCallback(
    (notification) => {
      if (!enabled || !notification) {
        return;
      }

      const notificationKey = getNotificationKey(notification);
      if (notificationKey && recentNotificationKeys.current.includes(notificationKey)) {
        return;
      }

      if (notificationKey) {
        recentNotificationKeys.current = [
          notificationKey,
          ...recentNotificationKeys.current,
        ].slice(0, RECENT_NOTIFICATION_LIMIT);
      }

      const prefix = mode === "admin" ? "Admin update" : mode === "rider" ? "Rider update" : "Order update";
      toast.info(`${prefix}: ${notification.message}`);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("notifications:refresh", {
            detail: {
              mode,
              notification,
            },
          })
        );
      }

      const now = Date.now();
      const canPlayFeedback = now - lastFeedbackAt.current >= FEEDBACK_COOLDOWN_MS;

      if (canPlayFeedback) {
        lastFeedbackAt.current = now;

        if (vibrationEnabled) {
          triggerNotificationVibration();
        }

        if (soundEnabled) {
          playNotificationChime().catch(() => {});
        }
      }
    },
    [enabled, mode, soundEnabled, toast, vibrationEnabled]
  );

  useNotificationStream({
    enabled,
    audience: mode,
    onNotification: handleNotification,
  });
}

export const playNotificationChime = async () => {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046, audioContext.currentTime + 0.18);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);

    await new Promise((resolve) => {
      oscillator.onended = resolve;
    });
  } finally {
    await audioContext.close().catch(() => {});
  }
};

export const triggerNotificationVibration = () => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate([120, 50, 120]);
};
