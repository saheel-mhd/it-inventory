"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";
import { apiFetch } from "~/lib/api-fetch";

type ProductOption = {
  id: string;
  sku: string;
  product: string;
};

type StaffOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

// An asset goes either to one person or to a whole team, never both at once.
type AssignTarget = "user" | "department";

type AssignProductModalProps = {
  products: ProductOption[];
  staffOptions: StaffOption[];
  departmentOptions?: DepartmentOption[];
  presetStaffId?: string;
  triggerLabel?: string;
  triggerIcon?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AssignProductModal({
  products,
  staffOptions,
  departmentOptions = [],
  presetStaffId,
  triggerLabel = "Assign",
  triggerIcon = "+",
}: AssignProductModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [target, setTarget] = useState<AssignTarget>("user");
  const [staffId, setStaffId] = useState(presetStaffId ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [startDate, setStartDate] = useState(todayIso());
  const [error, setError] = useState("");

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const resetForm = () => {
    setTarget("user");
    setDepartmentId("");
    setStaffId(presetStaffId ?? "");
    setProductId("");
    setQuantity("1");
    setStartDate(todayIso());
    setError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const resolvedStaffId = presetStaffId ?? staffId;
    const toDepartment = !presetStaffId && target === "department";

    if (toDepartment && !departmentId) {
      setError("Choose a department.");
      return;
    }
    if (!toDepartment && !resolvedStaffId) {
      setError("Choose a user.");
      return;
    }
    if (!productId) {
      setError("Product is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/staff/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          toDepartment
            ? { departmentId, productId }
            : {
                staffId: resolvedStaffId,
                productId,
                quantity: Number(quantity || 1),
                startDate,
              },
        ),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error ?? "Failed to assign product.");
        return;
      }

      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = productMap.get(productId);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {triggerIcon} {triggerLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close assign product dialog"
          />
          <div className="relative w-full max-w-2xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="text-base font-semibold text-gray-900">
                  Assign Product
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
                {!presetStaffId && (
                  <div className="space-y-3">
                    <div className="flex gap-2" role="group" aria-label="Assign to">
                      {(["user", "department"] as AssignTarget[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTarget(option);
                            setError("");
                          }}
                          aria-pressed={target === option}
                          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                            target === option
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option === "user" ? "A user" : "A department"}
                        </button>
                      ))}
                    </div>

                    {target === "user" ? (
                      <label className="block text-sm font-medium text-gray-700">
                        User
                        <select
                          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                          value={staffId}
                          onChange={(event) => setStaffId(event.target.value)}
                        >
                          <option value="">Select user</option>
                          {staffOptions.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="block text-sm font-medium text-gray-700">
                        Department
                        <select
                          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                          value={departmentId}
                          onChange={(event) => setDepartmentId(event.target.value)}
                        >
                          <option value="">Select department</option>
                          {departmentOptions.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                        <span className="mt-1 block text-xs font-normal text-gray-500">
                          For assets the whole team shares. Anyone currently
                          holding it is checked in first.
                        </span>
                      </label>
                    )}
                  </div>
                )}

                <div
                  className={`grid gap-4 md:grid-cols-2 ${
                    !presetStaffId && target === "department" ? "[&_[data-user-only]]:hidden" : ""
                  }`}
                >
                  <label className="text-sm font-medium text-gray-700">
                    Product SKU
                    <select
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      value={productId}
                      onChange={(event) => setProductId(event.target.value)}
                    >
                      <option value="">Select SKU</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Product Name
                    <div className="mt-2 h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 flex items-center">
                      {selectedProduct?.product ?? "-"}
                    </div>
                  </label>
                  <label data-user-only className="text-sm font-medium text-gray-700">
                    Quantity
                    <input
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                  </label>
                  <label data-user-only className="text-sm font-medium text-gray-700">
                    Assigned At
                    <input
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                  </label>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Assign"}
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
