"use client";

import { useEffect, useState } from "react";
import Button from "~/app/components/ui/button";

type Option = {
  id: string;
  name: string;
};

type ProductStatusOption = {
  value: string;
  label: string;
};

type ProductData = {
  id: string;
  product: string;
  brand: string;
  snNumber: string | null;
  sku: string;
  specification: string | null;
  orderedDate: string | null;
  cost: string | null;
  warranty: string | null;
  warrantyExpire: string | null;
  categoryId: string;
  assetTypeId: string;
  status: string;
};

type EditItemModalProps = {
  open: boolean;
  product: ProductData | null;
  categories: Option[];
  assetTypes: Option[];
  statusOptions: ProductStatusOption[];
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  product: string;
  brand: string;
  snNumber: string;
  sku: string;
  specification: string;
  orderedDate: string;
  cost: string;
  warranty: string;
  warrantyExpire: string;
  categoryId: string;
  assetTypeId: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

const WARRANTY_OPTIONS = [
  { value: "", label: "No warranty" },
  { value: "THREE_MONTHS", label: "3 months" },
  { value: "SIX_MONTHS", label: "6 months" },
  { value: "ONE_YEAR", label: "1 year" },
];

const getWarrantyMonths = (value: string) => {
  if (value === "THREE_MONTHS") return 3;
  if (value === "SIX_MONTHS") return 6;
  if (value === "ONE_YEAR") return 12;
  return 0;
};

const emptyForm: FormState = {
  product: "",
  brand: "",
  snNumber: "",
  sku: "",
  specification: "",
  orderedDate: "",
  cost: "",
  warranty: "",
  warrantyExpire: "",
  categoryId: "",
  assetTypeId: "",
  status: "",
};

export default function EditItemModal({
  open,
  product,
  categories,
  assetTypes,
  statusOptions,
  onClose,
  onSaved,
}: EditItemModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!product) return;
    setForm({
      product: product.product ?? "",
      brand: product.brand ?? "",
      snNumber: product.snNumber ?? "",
      sku: product.sku ?? "",
      specification: product.specification ?? "",
      orderedDate: product.orderedDate ?? "",
      cost: product.cost ?? "",
      warranty: product.warranty ?? "",
      warrantyExpire: product.warrantyExpire ?? "",
      categoryId: product.categoryId ?? "",
      assetTypeId: product.assetTypeId ?? "",
      status: product.status ?? "",
    });
    setErrors({});
  }, [product]);

  useEffect(() => {
    if (!form.warranty) {
      setForm((prev) => ({ ...prev, warrantyExpire: "" }));
      return;
    }

    const months = getWarrantyMonths(form.warranty);
    if (months === 0) return;
    const baseDate = form.orderedDate
      ? new Date(form.orderedDate)
      : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + months);
    setForm((prev) => ({
      ...prev,
      warrantyExpire: nextDate.toISOString().slice(0, 10),
    }));
  }, [form.warranty, form.orderedDate]);

  const setField =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.product.trim()) nextErrors.product = "Product name is required.";
    if (!form.brand.trim()) nextErrors.brand = "Brand is required.";
    if (!form.sku.trim()) nextErrors.sku = "SKU is required.";
    if (!form.categoryId) nextErrors.categoryId = "Category is required.";
    if (!form.assetTypeId) nextErrors.assetTypeId = "Asset type is required.";
    if (!form.status) nextErrors.status = "Status is required.";
    return nextErrors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          snNumber: form.snNumber || null,
          specification: form.specification || null,
          orderedDate: form.orderedDate || null,
          cost: form.cost || null,
          warranty: form.warranty || null,
          warrantyExpire: form.warrantyExpire || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrors(
          payload?.errors ?? { general: payload?.error ?? "Failed to update item." },
        );
        return;
      }

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close edit item dialog"
      />
      <div className="relative w-full max-w-2xl px-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-base font-semibold text-gray-900">Edit Item</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="p-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Product name
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={form.product}
                    onChange={setField("product")}
                  />
                  {errors.product && (
                    <div className="mt-1 text-xs text-red-600">{errors.product}</div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Brand
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={form.brand}
                    onChange={setField("brand")}
                  />
                  {errors.brand && (
                    <div className="mt-1 text-xs text-red-600">{errors.brand}</div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  SN Number
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={form.snNumber}
                    onChange={setField("snNumber")}
                  />
                  {errors.snNumber && (
                    <div className="mt-1 text-xs text-red-600">{errors.snNumber}</div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  SKU
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={form.sku}
                    onChange={setField("sku")}
                  />
                  {errors.sku && (
                    <div className="mt-1 text-xs text-red-600">{errors.sku}</div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Specification
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={form.specification}
                    onChange={setField("specification")}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Ordered date
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="date"
                    value={form.orderedDate}
                    onChange={setField("orderedDate")}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Cost
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={setField("cost")}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Warranty
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={form.warranty}
                    onChange={setField("warranty")}
                  >
                    {WARRANTY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Warranty expire
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="date"
                    value={form.warrantyExpire}
                    onChange={setField("warrantyExpire")}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Category
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={form.categoryId}
                    onChange={setField("categoryId")}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <div className="mt-1 text-xs text-red-600">
                      {errors.categoryId}
                    </div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Asset type
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={form.assetTypeId}
                    onChange={setField("assetTypeId")}
                  >
                    <option value="">Select asset type</option>
                    {assetTypes.map((assetType) => (
                      <option key={assetType.id} value={assetType.id}>
                        {assetType.name}
                      </option>
                    ))}
                  </select>
                  {errors.assetTypeId && (
                    <div className="mt-1 text-xs text-red-600">
                      {errors.assetTypeId}
                    </div>
                  )}
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Status
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={form.status}
                    onChange={setField("status")}
                  >
                    <option value="">Select status</option>
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <div className="mt-1 text-xs text-red-600">{errors.status}</div>
                  )}
                </label>
              </div>

              {errors.general && (
                <div className="text-sm text-red-600">{errors.general}</div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
