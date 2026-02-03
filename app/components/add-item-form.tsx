"use client";

import { useEffect, useState } from "react";
import Button from "~/app/components/ui/button";

type Option = {
  id: string;
  name: string;
};

type AddItemFormProps = {
  categories: Option[];
  assetTypes: Option[];
  onCreated?: () => void;
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
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

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
};

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

export default function AddItemForm({
  categories,
  assetTypes,
  onCreated,
}: AddItemFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

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

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.product.trim()) nextErrors.product = "Product name is required.";
    if (!form.brand.trim()) nextErrors.brand = "Brand is required.";
    if (!form.sku.trim()) nextErrors.sku = "SKU is required.";
    if (!form.categoryId) nextErrors.categoryId = "Category is required.";
    if (!form.assetTypeId) nextErrors.assetTypeId = "Asset type is required.";
    return nextErrors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const orderedDateValue = form.orderedDate || new Date().toISOString().slice(0, 10);
      const body = {
        ...form,
        orderedDate: orderedDateValue,
      };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrors(
          payload?.errors ?? { general: payload?.error ?? "Failed to save item." },
        );
        return;
      }

      setForm(emptyForm);
      setErrors({});
      onCreated?.();
    } catch (error) {
      console.error(error);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          Product name
          <input
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            name="product"
            placeholder="MacBook Pro 14"
            type="text"
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
            name="brand"
            placeholder="Apple"
            type="text"
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
            name="snNumber"
            placeholder="SN-123456"
            type="text"
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
            name="sku"
            placeholder="MBP-14-2025"
            type="text"
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
            name="specification"
            placeholder="M3 Pro, 18GB, 1TB"
            type="text"
            value={form.specification}
            onChange={setField("specification")}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Ordered date
          <input
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            name="orderedDate"
            type="date"
            value={form.orderedDate}
            onChange={setField("orderedDate")}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Cost
          <input
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.cost}
            onChange={setField("cost")}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Warranty
          <select
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            name="warranty"
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
            name="warrantyExpire"
            type="date"
            value={form.warrantyExpire}
            onChange={setField("warrantyExpire")}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Category
          <select
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            name="categoryId"
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
            <div className="mt-1 text-xs text-red-600">{errors.categoryId}</div>
          )}
        </label>

        <label className="text-sm font-medium text-gray-700">
          Asset type
          <select
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            name="assetTypeId"
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
            <div className="mt-1 text-xs text-red-600">{errors.assetTypeId}</div>
          )}
        </label>
      </div>

      {errors.general && (
        <div className="text-sm text-red-600">{errors.general}</div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Item"}
        </Button>
      </div>
    </form>
  );
}
