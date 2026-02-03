"use client";

import { useState } from "react";
import Button from "~/app/components/ui/button";
import AddItemForm from "~/app/components/add-item-form";
import AssignProductModal from "~/app/components/staff/assign-product-modal";

type Option = {
  id: string;
  name: string;
};

type InventoryToolbarProps = {
  categories: Option[];
  assetTypes: Option[];
  statusOptions: Array<{ value: string; label: string }>;
  assignProducts: Array<{ id: string; sku: string; product: string }>;
  staffOptions: Array<{ id: string; name: string }>;
  filters: {
    q: string;
    categoryId: string;
    status: string;
    sort: string;
  };
  onFilterChange: (filters: InventoryToolbarProps["filters"]) => void;
  onCreated: () => void;
  isLoading: boolean;
};

export default function InventoryToolbar({
  categories,
  assetTypes,
  statusOptions,
  assignProducts,
  staffOptions,
  filters,
  onFilterChange,
  onCreated,
  isLoading,
}: InventoryToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setIsOpen(true)}>
            + Add Item
          </Button>

          <input
            name="q"
            value={filters.q}
            placeholder="Search inventory..."
            className="w-80 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onChange={(event) =>
              onFilterChange({ ...filters, q: event.target.value })
            }
          />

          <div className="ml-auto">
            <AssignProductModal
              products={assignProducts}
              staffOptions={staffOptions}
              triggerLabel="Assign"
              triggerIcon="+"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700">Filters</div>

          <select
            name="categoryId"
            value={filters.categoryId}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
            onChange={(event) =>
              onFilterChange({ ...filters, categoryId: event.target.value })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
            onChange={(event) =>
              onFilterChange({ ...filters, status: event.target.value })
            }
          >
            <option value="">All availability</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            name="sort"
            value={filters.sort}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
            onChange={(event) =>
              onFilterChange({ ...filters, sort: event.target.value })
            }
          >
            <option value="updated_desc">Recently updated</option>
            <option value="updated_asc">Oldest updated</option>
          </select>

          {isLoading && (
            <div className="text-xs text-gray-500">Updating...</div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-label="Close add item dialog"
          />
          <div
            className="relative w-full max-w-2xl px-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-base font-semibold text-gray-900">
                  Add Item
                </div>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                <AddItemForm
                  categories={categories}
                  assetTypes={assetTypes}
                  onCreated={() => {
                    setIsOpen(false);
                    onCreated();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
