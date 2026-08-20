"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "~/lib/api-fetch";
import { CategoryOption, Option } from "~/app/components/products/product-form-types";
import Button from "~/app/components/ui/button";

/*
 * Recording a delivery.
 *
 * A purchase is one entry with a line per thing bought, because buying five
 * laptops and five mice is two decisions, not ten. Quantity does the repeating;
 * the only per-unit detail is the serial number, and only where one exists.
 */

type WarrantyOption = { id: string; name: string; months: number };

type LineState = {
  key: string;
  categoryId: string;
  productName: string;
  brand: string;
  quantity: string;
  cost: string;
  warrantyPeriodId: string;
  specification: string;
  serials: string;
};

type AddItemFormProps = {
  categories: CategoryOption[];
  assetTypes: Option[];
  warrantyPeriods: WarrantyOption[];
  onCreated?: () => void;
};

const newLine = (key: string): LineState => ({
  key,
  categoryId: "",
  productName: "",
  brand: "",
  quantity: "1",
  cost: "",
  warrantyPeriodId: "",
  specification: "",
  serials: "",
});

const addMonths = (from: string, months: number) => {
  const base = from ? new Date(from) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
};

const countSerials = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;

export default function AddItemForm({
  categories,
  warrantyPeriods,
  onCreated,
}: AddItemFormProps) {
  const [orderedDate, setOrderedDate] = useState("");
  const [lines, setLines] = useState<LineState[]>([newLine("line-0")]);
  const [nextKey, setNextKey] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuPreview, setSkuPreview] = useState<Record<string, string>>({});

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const setLine = (key: string, patch: Partial<LineState>) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, newLine(`line-${nextKey}`)]);
    setNextKey((value) => value + 1);
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  // Show the tag each line will actually be issued, so the numbering is visible
  // before anything is saved.
  useEffect(() => {
    const pending = lines.filter(
      (line) => line.categoryId && skuPreview[line.categoryId] === undefined,
    );
    if (pending.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const line of pending) {
        try {
          const response = await apiFetch(
            `/api/products/next-sku?categoryId=${encodeURIComponent(line.categoryId)}`,
          );
          const payload = await response.json().catch(() => ({}));
          if (cancelled) return;
          setSkuPreview((prev) => ({
            ...prev,
            [line.categoryId]: response.ok ? (payload?.sku ?? "") : "",
          }));
        } catch {
          if (!cancelled) {
            setSkuPreview((prev) => ({ ...prev, [line.categoryId]: "" }));
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lines, skuPreview]);

  const totalUnits = lines.reduce(
    (sum, line) => sum + (Number.parseInt(line.quantity, 10) || 0),
    0,
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payloadLines = lines.map((line) => {
      const category = categoryById.get(line.categoryId);
      const months =
        warrantyPeriods.find((w) => w.id === line.warrantyPeriodId)?.months ?? 0;
      return {
        categoryId: line.categoryId,
        assetTypeId: category?.assetTypeId ?? undefined,
        productName: line.productName,
        brand: line.brand,
        quantity: Number.parseInt(line.quantity, 10),
        cost: line.cost.trim() ? Number(line.cost) : null,
        warrantyPeriodId: line.warrantyPeriodId || null,
        warrantyExpire: months ? addMonths(orderedDate, months) : null,
        specification: line.specification,
        serialNumbers: line.serials
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      };
    });

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/products/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedDate: orderedDate || null, lines: payloadLines }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Could not record this purchase.");
        return;
      }
      setLines([newLine("line-0")]);
      setNextKey(1);
      setOrderedDate("");
      setSkuPreview({});
      onCreated?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm";
  const labelClass = "block text-xs font-medium text-gray-600";

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className={labelClass} htmlFor="orderedDate">
            Purchase date
          </label>
          <input
            id="orderedDate"
            type="date"
            value={orderedDate}
            onChange={(event) => setOrderedDate(event.target.value)}
            className={`${inputClass} mt-1 w-44`}
          />
        </div>
        <div className="text-sm text-gray-600">
          {lines.length} {lines.length === 1 ? "item" : "items"} · {totalUnits}{" "}
          {totalUnits === 1 ? "unit" : "units"}
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, index) => {
          const category = categoryById.get(line.categoryId);
          const isTagged = Boolean(category?.prefix?.trim());
          const quantity = Number.parseInt(line.quantity, 10) || 0;
          const serialCount = countSerials(line.serials);
          const preview = line.categoryId ? skuPreview[line.categoryId] : undefined;

          return (
            <div
              key={line.key}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Item {index + 1}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <label className={labelClass}>Category</label>
                  <select
                    value={line.categoryId}
                    onChange={(event) =>
                      setLine(line.key, { categoryId: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">Select…</option>
                    {categories.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                        {option.prefix ? ` (${option.prefix})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className={labelClass}>Product name</label>
                  <input
                    value={line.productName}
                    onChange={(event) =>
                      setLine(line.key, { productName: event.target.value })
                    }
                    placeholder="ThinkPad T14"
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={labelClass}>Brand</label>
                  <input
                    value={line.brand}
                    onChange={(event) => setLine(line.key, { brand: event.target.value })}
                    placeholder="General"
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className={labelClass}>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      setLine(line.key, { quantity: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className={labelClass}>Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.cost}
                    onChange={(event) => setLine(line.key, { cost: event.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={labelClass}>Warranty</label>
                  <select
                    value={line.warrantyPeriodId}
                    onChange={(event) =>
                      setLine(line.key, { warrantyPeriodId: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">None</option>
                    {warrantyPeriods.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <label className={labelClass}>Specification</label>
                  <input
                    value={line.specification}
                    onChange={(event) =>
                      setLine(line.key, { specification: event.target.value })
                    }
                    placeholder="16GB RAM / 512GB SSD"
                    className={`${inputClass} mt-1`}
                  />
                </div>

                {isTagged && (
                  <div className="lg:col-span-7">
                    <label className={labelClass}>
                      Serial numbers{" "}
                      <span className="font-normal text-gray-500">
                        — one per line, leave blank if these have none
                      </span>
                    </label>
                    <textarea
                      value={line.serials}
                      onChange={(event) =>
                        setLine(line.key, { serials: event.target.value })
                      }
                      rows={Math.min(Math.max(quantity, 2), 6)}
                      placeholder={"PF3ABC12\nPF3ABC13"}
                      className={`${inputClass} mt-1 font-mono text-xs`}
                    />
                    {serialCount > 0 && (
                      <div
                        className={`mt-1 text-xs ${
                          serialCount > quantity ? "text-red-600" : "text-gray-500"
                        }`}
                      >
                        {serialCount} of {quantity} units have a serial number
                      </div>
                    )}
                  </div>
                )}
              </div>

              {line.categoryId && (
                <div className="mt-2 text-xs text-gray-500">
                  {isTagged ? (
                    <>
                      Creates {quantity || 0} tagged{" "}
                      {quantity === 1 ? "asset" : "assets"}
                      {preview ? (
                        <>
                          , starting at <span className="ident">{preview}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      No SKU prefix on this category, so this is bulk stock: one
                      record with a quantity of {quantity || 0}. Add a prefix on
                      the category to tag each unit separately.
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
      >
        <span aria-hidden="true" className="text-base leading-none">
          +
        </span>
        Add another item
      </button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
        <Button type="submit" disabled={isSubmitting || totalUnits === 0}>
          {isSubmitting
            ? "Saving…"
            : `Receive ${totalUnits} ${totalUnits === 1 ? "unit" : "units"}`}
        </Button>
      </div>
    </form>
  );
}
