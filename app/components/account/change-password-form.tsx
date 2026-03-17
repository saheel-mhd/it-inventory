"use client";

import { useState } from "react";
import Button from "~/app/components/ui/button";

const getStrength = (password: string) => {
  if (!password) return { label: "", color: "" };
  if (password.length < 6) return { label: "Weak (min 6 chars)", color: "text-red-600" };
  if (password.length < 10) return { label: "Medium", color: "text-yellow-600" };
  return { label: "Strong", color: "text-green-600" };
};

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = getStrength(newPassword);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setError("Current and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Failed to update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch {
      setError("Unable to update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="current-password"
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="new-password"
          required
        />
        {strength.label && <div className={`mt-1 text-xs ${strength.color}`}>{strength.label}</div>}
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Confirm New Password
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="new-password"
          required
        />
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
