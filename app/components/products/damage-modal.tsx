"use client";

import { useEffect, useState } from "react";
import DamageModalSections from "~/app/components/products/damage-modal-sections";
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

const emptyState = {
  repairable: "",
  sentToService: "",
  serviceVendor: "",
  serviceReturnDate: "",
  notes: "",
  serviced: "",
  serviceDate: "",
  serviceCost: "",
  serviceMessage: "",
  serviceFailureReason: "",
  error: "",
};

export default function DamageModal({
  open,
  product,
  onClose,
  onSaved,
}: DamageModalProps) {
  const isUnderService = Boolean(product && product.status === "UNDER_SERVICE");
  const [state, setState] = useState(emptyState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setState(emptyState);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open || !product) return null;

  const setField = (field: keyof typeof emptyState) => (value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: "" }));

    const validationError = getValidationError(isUnderService, state);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(isUnderService ? "/api/products/service" : "/api/products/damage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isUnderService
            ? {
                productId: product.id,
                serviced: state.serviced === "yes",
                serviceDate:
                  state.serviceDate || new Date().toISOString().slice(0, 10),
                serviceCost: state.serviceCost.trim() || null,
                serviceMessage: state.serviceMessage.trim() || null,
                serviceFailureReason:
                  state.serviced === "no" ? state.serviceFailureReason.trim() : null,
              }
            : {
                productId: product.id,
                repairable: state.repairable === "yes",
                sentToService: state.sentToService === "yes",
                serviceVendor:
                  state.sentToService === "yes" ? state.serviceVendor.trim() : null,
                serviceReturnDate:
                  state.sentToService === "yes" ? state.serviceReturnDate : null,
                notes: state.repairable === "no" ? state.notes.trim() : null,
              },
        ),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          error: payload?.error ?? "Failed to update product.",
        }));
        return;
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
      }));
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
            <div className="text-base font-semibold text-gray-900">Mark as Damaged</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
            <DamageModalSections
              product={product}
              isUnderService={isUnderService}
              repairable={state.repairable}
              sentToService={state.sentToService}
              serviceVendor={state.serviceVendor}
              serviceReturnDate={state.serviceReturnDate}
              notes={state.notes}
              serviced={state.serviced}
              serviceDate={state.serviceDate}
              serviceCost={state.serviceCost}
              serviceMessage={state.serviceMessage}
              serviceFailureReason={state.serviceFailureReason}
              setRepairable={setField("repairable")}
              setSentToService={setField("sentToService")}
              setServiceVendor={setField("serviceVendor")}
              setServiceReturnDate={setField("serviceReturnDate")}
              setNotes={setField("notes")}
              setServiced={setField("serviced")}
              setServiceDate={setField("serviceDate")}
              setServiceCost={setField("serviceCost")}
              setServiceMessage={setField("serviceMessage")}
              setServiceFailureReason={setField("serviceFailureReason")}
            />

            {state.error && <div className="text-sm text-red-600">{state.error}</div>}

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

function getValidationError(
  isUnderService: boolean,
  state: typeof emptyState,
) {
  if (isUnderService) {
    if (!state.serviced) return "Please select whether the product is serviced.";
    if (state.serviced === "yes" && !state.serviceDate) {
      return "Please select the service date.";
    }
    if (state.serviced === "no" && !state.serviceFailureReason.trim()) {
      return "Please provide a reason.";
    }
    return "";
  }

  if (!state.repairable) return "Please select whether the item is repairable.";
  if (state.repairable === "no" && !state.notes.trim()) return "Please provide a reason.";
  if (state.repairable === "yes" && !state.sentToService) {
    return "Please select whether it is sent to service.";
  }
  if (state.repairable === "yes" && state.sentToService === "yes") {
    if (!state.serviceVendor.trim()) return "Please enter the service vendor name.";
    if (!state.serviceReturnDate) return "Please select the return date.";
  }
  return "";
}
