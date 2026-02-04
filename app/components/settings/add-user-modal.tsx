"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";

type AddUserModalProps = {
  onSaved?: () => void;
};

const getStrength = (password: string) => {
  if (!password) return { label: "", color: "" };
  if (password.length < 6) return { label: "Weak (min 6 chars)", color: "text-red-600" };
  if (password.length < 10) return { label: "Medium", color: "text-yellow-600" };
  return { label: "Strong", color: "text-green-600" };
};

export default function AddUserModal({ onSaved }: AddUserModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getStrength(password);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setIsActive(true);
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          isActive,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Failed to create user.");
        return;
      }

      setOpen(false);
      reset();
      onSaved?.();
      router.refresh();
    } catch {
      setError("Unable to save user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Add User
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            aria-label="Close add user dialog"
          />
          <div className="relative w-full max-w-lg px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border bg-white shadow-xl">
              <div className="border-b px-5 py-4">
                <div className="text-lg font-semibold text-gray-900">Add User</div>
              </div>
              <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
                <label className="block text-sm font-medium text-gray-700">
                  User Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter username"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter email"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter password"
                    required
                  />
                  {strength.label && (
                    <div className={`mt-1 text-xs ${strength.color}`}>{strength.label}</div>
                  )}
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active
                </label>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => {
                      setOpen(false);
                      reset();
                    }}
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save User"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
