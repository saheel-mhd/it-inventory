"use client";

import { useEffect, useState } from "react";
import Button from "~/app/components/ui/button";

type DamageModalProps = {
  open: boolean;
  product: {
    id: string;
    product: string;
    sku: string;
    warrantyExpire: string | null;
    cost: string | null;
    status: string;
  } | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function DamageModal({
  open,
  product,
  onClose,
  onSaved,
}: DamageModalProps) {
  const isUnderService = Boolean(product && product.status === "UNDER_SERVICE");
  const [repairable, setRepairable] = useState("");
  const [sentToService, setSentToService] = useState("");
  const [serviceVendor, setServiceVendor] = useState("");
  const [serviceReturnDate, setServiceReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [serviced, setServiced] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");
  const [serviceFailureReason, setServiceFailureReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRepairable("");
      setSentToService("");
      setServiceVendor("");
      setServiceReturnDate("");
      setNotes("");
      setServiced("");
      setServiceDate("");
      setServiceCost("");
      setServiceMessage("");
      setServiceFailureReason("");
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open || !product) return null;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isUnderService) {
      if (!serviced) {
        setError("Please select whether the product is serviced.");
        return;
      }
      if (serviced === "yes" && !serviceDate) {
        setError("Please select the service date.");
        return;
      }
      if (serviced === "no" && !serviceFailureReason.trim()) {
        setError("Please provide a reason.");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/products/service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            serviced: serviced === "yes",
            serviceDate: serviceDate || new Date().toISOString().slice(0, 10),
            serviceCost: serviceCost.trim() || null,
            serviceMessage: serviceMessage.trim() || null,
            serviceFailureReason:
              serviced === "no" ? serviceFailureReason.trim() : null,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setError(payload?.error ?? "Failed to update product.");
          return;
        }

        onSaved();
        onClose();
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!repairable) {
      setError("Please select whether the item is repairable.");
      return;
    }
    if (repairable === "no" && !notes.trim()) {
      setError("Please provide a reason.");
      return;
    }
    if (repairable === "yes" && !sentToService) {
      setError("Please select whether it is sent to service.");
      return;
    }
    if (repairable === "yes" && sentToService === "yes") {
      if (!serviceVendor.trim()) {
        setError("Please enter the service vendor name.");
        return;
      }
      if (!serviceReturnDate) {
        setError("Please select the return date.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/products/damage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          repairable: repairable === "yes",
          sentToService: sentToService === "yes",
          serviceVendor: sentToService === "yes" ? serviceVendor.trim() : null,
          serviceReturnDate: sentToService === "yes" ? serviceReturnDate : null,
          notes: repairable === "no" ? notes.trim() : null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error ?? "Failed to update product.");
        return;
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close damage dialog"
      />
      <div className="relative w-full max-w-2xl px-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="text-base font-semibold text-gray-900">
              Mark as Damaged
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Product
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {product.product}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  SKU
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {product.sku}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Warranty Expire
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {product.warrantyExpire
                    ? new Date(product.warrantyExpire).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Cost
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {product.cost ?? "-"}
                </div>
              </div>
            </div>

            {isUnderService ? (
              <>
                <label className="text-sm font-medium text-gray-700">
                  Product serviced
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={serviced}
                    onChange={(event) => {
                      const next = event.target.value;
                      setServiced(next);
                      if (next === "yes") {
                        setServiceDate(new Date().toISOString().slice(0, 10));
                      }
                    }}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {serviced === "yes" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">
                      Service date
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                        type="date"
                        value={serviceDate || new Date().toISOString().slice(0, 10)}
                        onChange={(event) => setServiceDate(event.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Repair cost
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                        type="number"
                        min="0"
                        step="0.01"
                        value={serviceCost}
                        onChange={(event) => setServiceCost(event.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700 md:col-span-2">
                      Message
                      <textarea
                        className="mt-2 min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={serviceMessage}
                        onChange={(event) => setServiceMessage(event.target.value)}
                        placeholder="Add message"
                      />
                    </label>
                  </div>
                )}

                {serviced === "no" && (
                  <label className="text-sm font-medium text-gray-700">
                    Reason
                    <textarea
                      className="mt-2 min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={serviceFailureReason}
                      onChange={(event) => setServiceFailureReason(event.target.value)}
                      placeholder="Add reason"
                    />
                  </label>
                )}
              </>
            ) : (
              <label className="text-sm font-medium text-gray-700">
                Is it repairable?
                <select
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  value={repairable}
                  onChange={(event) => setRepairable(event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            )}

            {!isUnderService && repairable === "yes" && (
              <label className="text-sm font-medium text-gray-700">
                Sent to service
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
            )}

            {!isUnderService && repairable === "yes" && sentToService === "yes" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Service vendor
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={serviceVendor}
                    onChange={(event) => setServiceVendor(event.target.value)}
                    placeholder="Vendor name"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Return date
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    type="date"
                    value={serviceReturnDate}
                    onChange={(event) => setServiceReturnDate(event.target.value)}
                  />
                </label>
              </div>
            )}

            {!isUnderService && repairable === "no" && (
              <label className="text-sm font-medium text-gray-700">
                Reason
                <textarea
                  className="mt-2 min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add reason"
                />
              </label>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
