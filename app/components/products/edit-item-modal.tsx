"use client";

import { useEffect, useState } from "react";
import ProductFormFields from "~/app/components/products/product-form-fields";
import {
  emptyProductForm,
  Option,
  ProductFormErrors,
  ProductFormState,
  ProductStatusOption,
} from "~/app/components/products/product-form-types";
import Button from "~/app/components/ui/button";

type ProductData = {
  id: string;
  product: string;
  brand: string;
  snNumber: string | null;
  sku: string;
  specification: string | null;
  orderedDate: string | null;
  cost: string | null;
  warrantyPeriodId: string | null;
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
  warrantyPeriods: Array<{ id: string; name: string; months: number }>;
  statusOptions: ProductStatusOption[];
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditItemModal({
  open,
  product,
  categories,
  assetTypes,
  warrantyPeriods,
  statusOptions,
  onClose,
  onSaved,
}: EditItemModalProps) {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [errors, setErrors] = useState<ProductFormErrors>({});
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
      warrantyPeriodId: product.warrantyPeriodId ?? "",
      warrantyExpire: product.warrantyExpire ?? "",
      categoryId: product.categoryId ?? "",
      assetTypeId: product.assetTypeId ?? "",
      status: product.status ?? "",
    });
    setErrors({});
  }, [product]);

  useEffect(() => {
    if (!form.warrantyPeriodId) {
      setForm((prev) => ({ ...prev, warrantyExpire: "" }));
      return;
    }

    const period = warrantyPeriods.find((item) => item.id === form.warrantyPeriodId);
    const months = period?.months ?? 0;
    if (months === 0) return;

    const baseDate = form.orderedDate ? new Date(form.orderedDate) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + months);
    setForm((prev) => ({
      ...prev,
      warrantyExpire: nextDate.toISOString().slice(0, 10),
    }));
  }, [form.orderedDate, form.warrantyPeriodId, warrantyPeriods]);

  const setField =
    (field: keyof ProductFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const validate = () => {
    const nextErrors: ProductFormErrors = {};
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
          warrantyPeriodId: form.warrantyPeriodId || null,
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
              <ProductFormFields
                form={form}
                errors={errors}
                categories={categories}
                assetTypes={assetTypes}
                warrantyPeriods={warrantyPeriods}
                statusOptions={statusOptions}
                onFieldChange={setField}
              />

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
