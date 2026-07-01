import { useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiSave } from "react-icons/fi";
import api from "../utils/axios";
import { useToast } from "../hooks/useToast";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordCard({ className = "" }) {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch("/users/me/password", form);
      setForm(initialForm);
      toast.success(data?.message || "Password updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const inputType = showPasswords ? "text" : "password";

  return (
    <section className={`surface-panel-lg p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#062A63]/10 text-[#062A63]">
            <FiLock />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Security settings</p>
            <h2 className="text-lg font-black text-slate-900">Change your password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your current password first, then choose a new password only you know.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPasswords((value) => !value)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#062A63]/30 hover:text-[#062A63]"
        >
          {showPasswords ? <FiEyeOff /> : <FiEye />}
          {showPasswords ? "Hide" : "Show"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Current password</span>
          <input
            type={inputType}
            className="input"
            value={form.currentPassword}
            onChange={(event) => updateField("currentPassword", event.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">New password</span>
            <input
              type={inputType}
              className="input"
              value={form.newPassword}
              onChange={(event) => updateField("newPassword", event.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</span>
            <input
              type={inputType}
              className="input"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-orange-800">
          For your protection, JAYTRIX will never change a signed-in user's password without the current password.
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            <FiSave />
            {saving ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </section>
  );
}
