"use client";

import { useEffect, useState } from "react";
import ProductFormFields from "~/app/components/products/product-form-fields";
import {
  CategoryOption,
  emptyProductForm,
  Option,
  ProductFormErrors,
  ProductFormState,
} from "~/app/components/products/product-form-types";
import Button from "~/app/components/ui/button";

type AddItemFormProps = {
  categories: CategoryOption[];
  assetTypes: Option[];
  warrantyPeriods: Array<{ id: string; name: string; months: number }>;
  onCreated?: () => void;
};

export default function AddItemForm({
  categories,
  assetTypes,
  warrantyPeriods,
  onCreated,
}: AddItemFormProps) {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkuLoading, setIsSkuLoading] = useState(false);

  const setField =
    (field: keyof ProductFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

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

  useEffect(() => {
    if (!form.assetTypeId) {
      setForm((prev) => ({ ...prev, categoryId: "", sku: "" }));
      return;
    }

    const selectedCategory = categories.find((item) => item.id === form.categoryId);
    if (!selectedCategory || selectedCategory.assetTypeId !== form.assetTypeId) {
      setForm((prev) => ({ ...prev, categoryId: "", sku: "" }));
    }
  }, [categories, form.assetTypeId, form.categoryId]);

  useEffect(() => {
    if (!form.categoryId) {
      setForm((prev) => ({ ...prev, sku: "" }));
      return;
    }

    const controller = new AbortController();
    setIsSkuLoading(true);

    const loadNextSku = async () => {
      try {
        const response = await fetch(
          `/api/products/next-sku?categoryId=${encodeURIComponent(form.categoryId)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setErrors((prev) => ({
            ...prev,
            sku: payload?.error ?? "Failed to generate SKU.",
          }));
          setForm((prev) => ({ ...prev, sku: "" }));
          return;
        }

        setErrors((prev) => ({ ...prev, sku: undefined }));
        setForm((prev) => ({ ...prev, sku: payload?.sku ?? "" }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setErrors((prev) => ({ ...prev, sku: "Failed to generate SKU." }));
        }
      } finally {
        setIsSkuLoading(false);
      }
    };

    loadNextSku();
    return () => controller.abort();
  }, [form.categoryId]);

  const validate = () => {
    const nextErrors: ProductFormErrors = {};
    if (!form.product.trim()) nextErrors.product = "Product name is required.";
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
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orderedDate: form.orderedDate || new Date().toISOString().slice(0, 10),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrors(payload?.errors ?? { general: payload?.error ?? "Failed to save item." });
        return;
      }

      setForm(emptyProductForm);
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
    <form className="space-y-4" onSubmit={onSubmit}>
      <ProductFormFields
        form={form}
        errors={errors}
        categories={categories}
        assetTypes={assetTypes}
        warrantyPeriods={warrantyPeriods}
        onFieldChange={setField}
        skuHint={isSkuLoading ? "Generating SKU..." : undefined}
      />

      {errors.general && <div className="text-sm text-red-600">{errors.general}</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Item"}
        </Button>
      </div>
    </form>
  );
}
