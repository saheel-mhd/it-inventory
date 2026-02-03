"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";

type ReturnProductModalProps = {
  assignmentId: string;
  productName: string;
  sku: string;
  staffName?: string | null;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  triggerClassName?: string;
  onSaved?: () => void;
};

const REASONS = [
  { value: "RESIGNED", label: "Resigned" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "NOT_NEEDED", label: "Not needed anymore" },
  { value: "OTHER", label: "Other" },
];

export default function ReturnProductModal({
  assignmentId,
  productName,
  sku,
  staffName,
  triggerLabel = "Return",
  triggerIcon,
  triggerClassName,
  onSaved,
}: ReturnProductModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [repairable, setRepairable] = useState("");
  const [sentToService, setSentToService] = useState("");
  const [serviceVendor, setServiceVendor] = useState("");
  const [serviceReturnDate, setServiceReturnDate] = useState("");
  const [damageReason, setDamageReason] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setReason("");
    setOtherReason("");
    setRepairable("");
    setSentToService("");
    setServiceVendor("");
    setServiceReturnDate("");
    setDamageReason("");
    setError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!reason) {
      setError("Return reason is required.");
      return;
    }
    if (reason === "OTHER" && !otherReason.trim()) {
      setError("Please add a reason.");
      return;
    }

    const isDamaged = reason === "DAMAGED";
    if (isDamaged && !repairable) {
      setError("Please select if the item is serviceable.");
      return;
    }
    if (isDamaged && repairable === "yes" && !sentToService) {
      setError("Please select if the item is sent to service.");
      return;
    }
    if (isDamaged && repairable === "yes" && sentToService === "yes") {
      if (!serviceVendor.trim()) {
        setError("Service vendor is required.");
        return;
      }
      if (!serviceReturnDate) {
        setError("Service return date is required.");
        return;
      }
    }
    if (isDamaged && repairable === "no" && !damageReason.trim()) {
      setError("Please add a reason for non-serviceable damage.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          reason,
          otherReason: otherReason.trim() || null,
          repairable: isDamaged ? repairable === "yes" : null,
          sentToService: isDamaged && repairable === "yes" ? sentToService === "yes" : null,
          serviceVendor: serviceVendor.trim() || null,
          serviceReturnDate: serviceReturnDate || null,
          damageReason: damageReason.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error ?? "Failed to return product.");
        return;
      }

      resetForm();
      setOpen(false);
      onSaved?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={
          triggerClassName ??
          "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        }
        onClick={() => setOpen(true)}
      >
        {triggerIcon}
        {triggerLabel ? (
          <span className={triggerIcon ? "ml-2" : undefined}>{triggerLabel}</span>
        ) : null}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close return dialog"
          />
          <div className="relative w-full max-w-2xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    Return Product
                  </div>
                  <div className="text-xs text-gray-500">
                    {productName} • {sku}
                    {staffName ? ` • ${staffName}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Return Reason
                    <select
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      value={reason}
                      onChange={(event) => {
                        const next = event.target.value;
                        setReason(next);
                        if (next !== "DAMAGED") {
                          setRepairable("");
                          setSentToService("");
                          setServiceVendor("");
                          setServiceReturnDate("");
                          setDamageReason("");
                        }
                        if (next !== "OTHER") {
                          setOtherReason("");
                        }
                      }}
                    >
                      <option value="">Select reason</option>
                      {REASONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {reason === "OTHER" && (
                  <label className="text-sm font-medium text-gray-700">
                    Reason Details
                    <textarea
                      className="mt-2 min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      value={otherReason}
                      onChange={(event) => setOtherReason(event.target.value)}
                      placeholder="Add a short reason..."
                    />
                  </label>
                )}

                {reason === "DAMAGED" && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      Is it serviceable?
                      <select
                        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                        value={repairable}
                        onChange={(event) => {
                          const next = event.target.value;
                          setRepairable(next);
                          if (next !== "yes") {
                            setSentToService("");
                            setServiceVendor("");
                            setServiceReturnDate("");
                          }
                          if (next !== "no") {
                            setDamageReason("");
                          }
                        }}
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>

                    {repairable === "yes" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-gray-700">
                          Sent to service?
                          <select
                            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                            value={sentToService}
                            onChange={(event) => setSentToService(event.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                        {sentToService === "yes" && (
                          <>
                            <label className="text-sm font-medium text-gray-700">
                              Service Vendor
                              <input
                                className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                                value={serviceVendor}
                                onChange={(event) => setServiceVendor(event.target.value)}
                                placeholder="Vendor name"
                              />
                            </label>
                            <label className="text-sm font-medium text-gray-700">
                              Expected Return Date
                              <input
                                className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                                type="date"
                                value={serviceReturnDate}
                                onChange={(event) =>
                                  setServiceReturnDate(event.target.value)
                                }
                              />
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    {repairable === "no" && (
                      <label className="text-sm font-medium text-gray-700">
                        Reason (not serviceable)
                        <textarea
                          className="mt-2 min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                          value={damageReason}
                          onChange={(event) => setDamageReason(event.target.value)}
                          placeholder="Add a short reason..."
                        />
                      </label>
                    )}
                  </div>
                )}

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Return"}
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
