import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { FaPaperPlane } from "react-icons/fa";
import { extractList } from "../../utils/apiShape";
import PageState from "../../components/PageState";
import useNotificationPreferences from "../../hooks/useNotificationPreferences";
import useToast from "../../hooks/useToast";
import { reportClientIssue } from "../../utils/reportClientIssue";

const externalStatusClass = (status) => {
  if (status === "sent") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "skipped") return "bg-slate-100 text-slate-600";
  return "bg-blue-100 text-[#062A63]";
};

const formatExternalChannel = (channel) => {
  if (!channel) return "In-app only";
  return channel.replace(/_/g, " ");
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [smsStats, setSmsStats] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState({
    externalChannels: "",
    externalTypes: "",
    mesejiWhatsappEnabled: false,
    mesejiSmsEnabled: false,
  });
  const [testPhone, setTestPhone] = useState("");
  const [testChannel, setTestChannel] = useState("meseji_sms");
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const notificationPreferences = useNotificationPreferences("admin");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/admin/audit");
      const settingsResponse = await axios.get("/admin/messaging-settings");
      const smsStatsResponse = await axios.get("/admin/messaging-settings/sms-stats");
      const logs = extractList(data, ["items"]);
      setNotifications(logs.filter((item) => item.type === "notification"));
      setPaymentLogs(logs.filter((item) => item.type === "payment"));
      const nextSettings = settingsResponse.data?.data || null;
      setSettings(nextSettings);
      setSmsStats(smsStatsResponse.data?.data || null);
      setSettingsDraft({
        externalChannels: (nextSettings?.externalChannels || []).join(","),
        externalTypes: (nextSettings?.externalTypes || []).join(","),
        mesejiWhatsappEnabled: Boolean(nextSettings?.mesejiWhatsappEnabled),
        mesejiSmsEnabled: Boolean(nextSettings?.mesejiSmsEnabled),
      });
      setError("");
    } catch {
      reportClientIssue("Notification center could not be loaded");
      setError("Notifications could not be loaded right now");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const sendNotification = async (orderId) => {
    try {
      setSendingId(orderId);
      await axios.post(`/admin/notifications/send`, { orderId });
      fetchNotifications();
    } catch (err) {
      reportClientIssue("Notification could not be sent");
      toast.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSendingId(null);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);
      await axios.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      reportClientIssue("Notification read status could not be saved");
      toast.error(err.response?.data?.message || "Failed to mark notification as read");
    } finally {
      setMarkingId(null);
    }
  };

  const retryExternal = async (notificationId) => {
    try {
      setRetryingId(notificationId);
      const { data } = await axios.post(`/admin/notifications/${notificationId}/retry-external`);
      toast.success(data?.message || "External delivery retried");
      fetchNotifications();
    } catch (err) {
      reportClientIssue("Message retry could not be completed");
      toast.error(err.response?.data?.message || "Failed to retry external delivery");
    } finally {
      setRetryingId(null);
    }
  };

  const saveMessagingSettings = async () => {
    try {
      setSavingSettings(true);
      const { data } = await axios.patch("/admin/messaging-settings", {
        externalChannels: settingsDraft.externalChannels
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        externalTypes: settingsDraft.externalTypes
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        mesejiWhatsappEnabled: settingsDraft.mesejiWhatsappEnabled,
        mesejiSmsEnabled: settingsDraft.mesejiSmsEnabled,
      });
      const nextSettings = data?.data || null;
      setSettings(nextSettings);
      setSettingsDraft({
        externalChannels: (nextSettings?.externalChannels || []).join(","),
        externalTypes: (nextSettings?.externalTypes || []).join(","),
        mesejiWhatsappEnabled: Boolean(nextSettings?.mesejiWhatsappEnabled),
        mesejiSmsEnabled: Boolean(nextSettings?.mesejiSmsEnabled),
      });
      toast.success(data?.message || "Messaging settings updated");
    } catch (err) {
      reportClientIssue("Messaging settings could not be saved");
      toast.error(err.response?.data?.message || "Failed to update messaging settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      setSendingTest(true);
      const { data } = await axios.post("/admin/messaging-settings/test", {
        phone: testPhone,
        channel: testChannel,
        message: "Test message from marketplace notifications.",
      });
      toast.success(data?.message || "Test message processed");
    } catch (err) {
      reportClientIssue("Test message could not be sent");
      toast.error(err.response?.data?.message || "Failed to send test message");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <PageState title="Loading notifications..." />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-[28px] border border-[#062A63]/10 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_44%,#fff7ed_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#062A63]">Operations Signals</p>
        <h1 className="mt-1 text-xl font-black text-slate-900 md:text-2xl">Notifications</h1>
      </div>
      {error ? (
        <PageState tone="error" title="Notifications unavailable" description={error} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">
          Live Alerts
        </span>
        <button
          type="button"
          onClick={() => notificationPreferences.setSoundEnabled(!notificationPreferences.soundEnabled)}
          className={`rounded-full border px-3 py-1 ${
            notificationPreferences.soundEnabled
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          Sound {notificationPreferences.soundEnabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          onClick={() =>
            notificationPreferences.setVibrationEnabled(!notificationPreferences.vibrationEnabled)
          }
          className={`rounded-full border px-3 py-1 ${
            notificationPreferences.vibrationEnabled
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          Vibration {notificationPreferences.vibrationEnabled ? "On" : "Off"}
        </button>
      </div>

      <section className="rounded-[26px] border border-white/80 bg-white/[0.92] p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Customer Messaging</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Meseji messaging controls</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Choose which customer updates may be sent by SMS or WhatsApp. Private provider details stay protected away from the dashboard.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 ${settings?.providers?.mesejiWhatsapp?.configured ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {settings?.providers?.mesejiWhatsapp?.configured ? "WhatsApp configured" : "WhatsApp credentials missing"}
              </span>
              <span className={`rounded-full px-3 py-1 ${settingsDraft.mesejiWhatsappEnabled ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                {settingsDraft.mesejiWhatsappEnabled ? "WhatsApp enabled" : "WhatsApp disabled"}
              </span>
              <span className={`rounded-full px-3 py-1 ${settings?.providers?.mesejiSms?.configured ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {settings?.providers?.mesejiSms?.configured ? "Meseji SMS ready" : "SMS setup incomplete"}
              </span>
              <span className={`rounded-full px-3 py-1 ${settingsDraft.mesejiSmsEnabled ? "bg-blue-100 text-[#062A63]" : "bg-slate-100 text-slate-600"}`}>
                {settingsDraft.mesejiSmsEnabled ? "SMS enabled" : "SMS disabled"}
              </span>
            </div>
          </div>
          <div className="grid w-full gap-3 lg:max-w-xl">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Channels</label>
            <input
              className="input"
              value={settingsDraft.externalChannels}
              onChange={(event) => setSettingsDraft((current) => ({ ...current, externalChannels: event.target.value }))}
              placeholder="meseji_whatsapp,meseji_sms"
            />
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Allowed notification types</label>
            <input
              className="input"
              value={settingsDraft.externalTypes}
              onChange={(event) => setSettingsDraft((current) => ({ ...current, externalTypes: event.target.value }))}
              placeholder="rider_payment_settled,customer_delivery_issue_update"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSettingsDraft((current) => ({ ...current, mesejiWhatsappEnabled: !current.mesejiWhatsappEnabled }))}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${settingsDraft.mesejiWhatsappEnabled ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-600"}`}
              >
                Meseji WhatsApp {settingsDraft.mesejiWhatsappEnabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => setSettingsDraft((current) => ({ ...current, mesejiSmsEnabled: !current.mesejiSmsEnabled }))}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${settingsDraft.mesejiSmsEnabled ? "border-[#062A63]/20 bg-blue-50 text-[#062A63]" : "border-slate-200 bg-white text-slate-600"}`}
              >
                Meseji SMS {settingsDraft.mesejiSmsEnabled ? "On" : "Off"}
              </button>
              <button type="button" onClick={saveMessagingSettings} disabled={savingSettings} className="btn-primary disabled:opacity-60">
                {savingSettings ? "Saving..." : "Save messaging settings"}
              </button>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Test Meseji delivery</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select
                  className="input sm:max-w-[170px]"
                  value={testChannel}
                  onChange={(event) => setTestChannel(event.target.value)}
                >
                  <option value="meseji_sms">SMS</option>
                  <option value="meseji_whatsapp">WhatsApp</option>
                </select>
                <input
                  className="input flex-1"
                  value={testPhone}
                  onChange={(event) => setTestPhone(event.target.value)}
                  placeholder="0712345678"
                />
                <button
                  type="button"
                  onClick={sendTestMessage}
                  disabled={sendingTest || !testPhone.trim()}
                  className="rounded-2xl border border-[#062A63]/15 bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {sendingTest ? "Sending..." : "Send test"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Use this after the messaging account has been connected for production use.</p>
            </div>
            <div className="rounded-3xl border border-[#062A63]/10 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">SMS account health</p>
              {smsStats?.skipped ? (
                <p className="mt-2 text-sm font-semibold text-slate-600">{smsStats.reason || "SMS stats unavailable"}</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-2xl bg-white px-3 py-2 font-semibold text-[#062A63]">
                    Balance: {smsStats?.stats?.balance ?? "N/A"}
                  </span>
                  <span className="rounded-2xl bg-white px-3 py-2 font-semibold text-[#062A63]">
                    Success: {smsStats?.stats?.successRate ?? "N/A"}
                  </span>
                  <span className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                    Sent: {smsStats?.stats?.totalSent ?? "N/A"}
                  </span>
                  <span className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                    Failed: {smsStats?.stats?.failedDeliveries ?? "N/A"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="surface-panel-scroll">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] text-slate-600">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Category</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
              <th className="p-3">External</th>
              <th className="p-3">Read</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {notifications.map((n) => (
              <tr key={n._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="p-3">{String(n.orderId || "").slice(-5)}</td>
                <td className="p-3">{n.customerName || n.userName || "N/A"}</td>
                <td className="p-3 text-xs font-semibold text-slate-700">
                  {n.notificationType || n.type}
                  {n.source === "audit_log" ? (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Audit
                    </span>
                  ) : null}
                </td>
                <td className="p-3 text-sm text-slate-700">{n.message}</td>
                <td
                  className={`p-3 text-center font-semibold ${
                    n.status === "sent" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {n.status || "logged"}
                </td>
                <td className="p-3 text-xs text-slate-600">
                  <div className="flex flex-col gap-1">
                    <span className={`w-fit rounded-full px-2.5 py-1 font-semibold capitalize ${externalStatusClass(n.externalStatus)}`}>
                      {n.externalStatus || "in-app"}
                    </span>
                    <span className="capitalize">{formatExternalChannel(n.externalChannel)}</span>
                    {n.externalSentAt ? (
                      <span className="text-[11px] text-slate-400">{new Date(n.externalSentAt).toLocaleString()}</span>
                    ) : null}
                    {n.externalError ? (
                      <span className="max-w-[220px] text-[11px] text-red-600">{n.externalError}</span>
                    ) : null}
                  </div>
                </td>
                <td className="p-3 text-center text-xs text-slate-500">{n.read ? "read" : "unread"}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {n.source !== "audit_log" && n.status !== "sent" && n.orderId ? (
                      <button
                        onClick={() => sendNotification(n.orderId)}
                        disabled={sendingId === n.orderId}
                        className="flex items-center space-x-1 rounded-full bg-[linear-gradient(135deg,#062A63_0%,#031326_100%)] px-3 py-1 text-xs text-white hover:brightness-110"
                      >
                        <FaPaperPlane />
                        <span>Send</span>
                      </button>
                    ) : (
                      <span>✓</span>
                    )}

                    {n.source !== "audit_log" && !n.read ? (
                      <button
                        onClick={() => markAsRead(n._id)}
                        disabled={markingId === n._id}
                        className="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
                      >
                        Mark read
                      </button>
                    ) : null}

                    {n.source !== "audit_log" && ["failed", "skipped"].includes(n.externalStatus) ? (
                      <button
                        onClick={() => retryExternal(n._id)}
                        disabled={retryingId === n._id}
                        className="rounded-full border border-[#062A63]/20 bg-white px-3 py-1 text-xs font-medium text-[#062A63] hover:bg-blue-50 disabled:opacity-60"
                      >
                        {retryingId === n._id ? "Retrying..." : "Retry external"}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={8} className="p-3 text-center text-slate-500">
                  No notifications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="surface-panel-scroll">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] text-slate-600">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Action</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Status</th>
              <th className="p-3">Message</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>

          <tbody>
            {paymentLogs.map((log) => (
              <tr key={log.id || log._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="p-3">{log.orderId ? `#${log.orderId}` : "N/A"}</td>
                <td className="p-3 text-xs font-semibold text-slate-700">{log.action}</td>
                <td className="p-3 text-xs text-slate-500">
                  {log.meta?.reference || log.meta?.receivedReference || "N/A"}
                </td>
                <td className="p-3 text-xs text-slate-500">
                  {log.meta?.paymentStatus || log.meta?.eventType || "logged"}
                </td>
                <td className="p-3 text-sm text-slate-700">{log.message}</td>
                <td className="p-3 text-xs text-slate-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                </td>
              </tr>
            ))}
            {paymentLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-slate-500">
                  No payment confirmation records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
