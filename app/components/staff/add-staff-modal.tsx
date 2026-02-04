"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";

type ProductOption = {
  id: string;
  sku: string;
  product: string;
};

type AddStaffModalProps = {
  products: ProductOption[];
  departments: Array<{ id: string; name: string }>;
};

type AssignmentRow = {
  productId: string;
  quantity: string;
  startDate: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddStaffModal({ products, departments }: AddStaffModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [rows, setRows] = useState<AssignmentRow[]>([
    { productId: "", quantity: "1", startDate: todayIso() },
  ]);
  const [error, setError] = useState("");

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const resetForm = () => {
    setName("");
    setDepartment("");
    setRows([{ productId: "", quantity: "1", startDate: todayIso() }]);
    setError("");
  };

  const addRow = () => {
    setRows((prev) => [...prev, { productId: "", quantity: "1", startDate: todayIso() }]);
  };

  const updateRow = (index: number, key: keyof AssignmentRow, value: string) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)),
    );
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!department) {
      setError("Department is required.");
      return;
    }

    const cleanedRows = rows.filter((row) => row.productId);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          departmentId: department,
          assignments: cleanedRows.map((row) => ({
            productId: row.productId,
            quantity: Number(row.quantity || 1),
            startDate: row.startDate || todayIso(),
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error ?? "Failed to save staff.");
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

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Add Staff
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close add staff dialog"
          />
          <div className="relative w-full max-w-3xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="text-base font-semibold text-gray-900">Add Staff</div>
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
                    Name
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Staff name"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Department
                    <select
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-xl border border-gray-200">
                  <div className="grid grid-cols-[1.1fr_1.3fr_0.6fr_0.9fr_0.2fr] gap-3 border-b bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                    <div>Product SKU</div>
                    <div>Product Name</div>
                    <div>Qty</div>
                    <div>Assigned At</div>
                    <div className="text-right">+</div>
                  </div>
                  <div className="divide-y">
                    {rows.map((row, index) => {
                      const product = row.productId
                        ? productMap.get(row.productId)
                        : null;
                      return (
                        <div
                          key={`row-${index}`}
                          className="grid grid-cols-[1.1fr_1.3fr_0.6fr_0.9fr_0.2fr] gap-3 px-4 py-3"
                        >
                          <select
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                            value={row.productId}
                            onChange={(event) =>
                              updateRow(index, "productId", event.target.value)
                            }
                          >
                            <option value="">Select SKU</option>
                            {products.map((productOption) => (
                              <option key={productOption.id} value={productOption.id}>
                                {productOption.sku}
                              </option>
                            ))}
                          </select>
                          <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                            {product?.product ?? "-"}
                          </div>
                          <input
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(event) =>
                              updateRow(index, "quantity", event.target.value)
                            }
                          />
                          <input
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                            type="date"
                            value={row.startDate}
                            onChange={(event) =>
                              updateRow(index, "startDate", event.target.value)
                            }
                          />
                          <div className="flex items-center justify-end">
                            {index === rows.length - 1 && (
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
                                onClick={addRow}
                                aria-label="Add row"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Staff"}
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
