"use client";

import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import Button from "~/app/components/ui/button";
import {
  IconAssetType,
  IconCategory,
  IconDepartment,
  IconWarranty,
} from "~/app/components/ui/icons";

type NamedItem = {
  id: string;
  name: string;
};

type WarrantyItem = NamedItem & {
  months: number;
};

type ConfigureGridProps = {
  initialCategories: NamedItem[];
  initialAssetTypes: NamedItem[];
  initialDepartments: NamedItem[];
  initialWarrantyPeriods: WarrantyItem[];
};

type ToastState = {
  type: "error" | "success";
  message: string;
} | null;

type ConfigType = "category" | "assetType" | "department" | "warranty";

type ConfigMeta = {
  key: ConfigType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  listTitle: string;
  addTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  createEndpoint: string;
  deleteEndpoint: string;
  successAddMessage: string;
  successDeleteMessage: string;
  parseCreate: (payload: unknown) => NamedItem | WarrantyItem | null;
  parseDeleteErrorFallback: string;
};

const CONFIG_META: ConfigMeta[] = [
  {
    key: "category",
    label: "Category",
    icon: IconCategory,
    listTitle: "Categories",
    addTitle: "Add Category",
    nameLabel: "Category Name",
    namePlaceholder: "Enter category name",
    createEndpoint: "/api/categories",
    deleteEndpoint: "/api/categories",
    successAddMessage: "Category added.",
    successDeleteMessage: "Category deleted.",
    parseCreate: (payload) => {
      const category = (payload as { category?: NamedItem })?.category;
      return category?.id && category?.name ? category : null;
    },
    parseDeleteErrorFallback: "There is a product in this category, can't delete category now.",
  },
  {
    key: "assetType",
    label: "Asset Type",
    icon: IconAssetType,
    listTitle: "Asset Types",
    addTitle: "Add Asset Type",
    nameLabel: "Asset Type Name",
    namePlaceholder: "Enter asset type name",
    createEndpoint: "/api/asset-types",
    deleteEndpoint: "/api/asset-types",
    successAddMessage: "Asset type added.",
    successDeleteMessage: "Asset type deleted.",
    parseCreate: (payload) => {
      const assetType = (payload as { assetType?: NamedItem })?.assetType;
      return assetType?.id && assetType?.name ? assetType : null;
    },
    parseDeleteErrorFallback: "There is a product in this asset type, can't delete now.",
  },
  {
    key: "department",
    label: "Department",
    icon: IconDepartment,
    listTitle: "Departments",
    addTitle: "Add Department",
    nameLabel: "Department Name",
    namePlaceholder: "Enter department name",
    createEndpoint: "/api/departments",
    deleteEndpoint: "/api/departments",
    successAddMessage: "Department added.",
    successDeleteMessage: "Department deleted.",
    parseCreate: (payload) => {
      const department = (payload as { department?: NamedItem })?.department;
      return department?.id && department?.name ? department : null;
    },
    parseDeleteErrorFallback: "There are staff members in this department, can't delete now.",
  },
  {
    key: "warranty",
    label: "Warranty",
    icon: IconWarranty,
    listTitle: "Warranty Periods",
    addTitle: "Add Warranty Period",
    nameLabel: "Warranty Name",
    namePlaceholder: 'Enter warranty name (ex: "3 months")',
    createEndpoint: "/api/warranty-periods",
    deleteEndpoint: "/api/warranty-periods",
    successAddMessage: "Warranty period added.",
    successDeleteMessage: "Warranty period deleted.",
    parseCreate: (payload) => {
      const warrantyPeriod = (payload as { warrantyPeriod?: WarrantyItem })?.warrantyPeriod;
      return warrantyPeriod?.id && warrantyPeriod?.name ? warrantyPeriod : null;
    },
    parseDeleteErrorFallback: "There are products using this warranty period, can't delete now.",
  },
];

export default function ConfigureGrid({
  initialCategories,
  initialAssetTypes,
  initialDepartments,
  initialWarrantyPeriods,
}: ConfigureGridProps) {
  const [categories, setCategories] = useState<NamedItem[]>(initialCategories);
  const [assetTypes, setAssetTypes] = useState<NamedItem[]>(initialAssetTypes);
  const [departments, setDepartments] = useState<NamedItem[]>(initialDepartments);
  const [warrantyPeriods, setWarrantyPeriods] = useState<WarrantyItem[]>(initialWarrantyPeriods);
  const [activeType, setActiveType] = useState<ConfigType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("12");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const activeMeta = useMemo(
    () => CONFIG_META.find((item) => item.key === activeType) ?? null,
    [activeType],
  );

  const activeList = useMemo(() => {
    if (activeType === "category") return categories;
    if (activeType === "assetType") return assetTypes;
    if (activeType === "department") return departments;
    if (activeType === "warranty") return warrantyPeriods;
    return [];
  }, [activeType, assetTypes, categories, departments, warrantyPeriods]);

  const sortedActiveList = useMemo(
    () => [...activeList].sort((a, b) => a.name.localeCompare(b.name)),
    [activeList],
  );

  const showToast = (next: ToastState) => {
    setToast(next);
    setTimeout(() => setToast(null), 2800);
  };

  const closeMainDialog = () => {
    setActiveType(null);
    setIsAddOpen(false);
    setNameInput("");
    setMonthsInput("12");
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeMeta || !activeType) return;

    const name = nameInput.trim();
    if (!name) {
      showToast({ type: "error", message: `${activeMeta.nameLabel} is required.` });
      return;
    }

    if (activeType === "warranty") {
      const months = Number(monthsInput);
      if (!Number.isFinite(months) || months <= 0 || !Number.isInteger(months)) {
        showToast({ type: "error", message: "Months must be a positive whole number." });
        return;
      }
    }

    const body =
      activeType === "warranty"
        ? { name, months: Number(monthsInput) }
        : {
            name,
          };

    setIsSaving(true);
    try {
      const response = await fetch(activeMeta.createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast({ type: "error", message: payload?.error ?? `Failed to add ${activeMeta.label}.` });
        return;
      }

      const created = activeMeta.parseCreate(payload);
      if (!created) {
        showToast({ type: "error", message: `Failed to parse ${activeMeta.label} response.` });
        return;
      }

      if (activeType === "category") {
        setCategories((prev) => [...prev, created as NamedItem]);
      } else if (activeType === "assetType") {
        setAssetTypes((prev) => [...prev, created as NamedItem]);
      } else if (activeType === "department") {
        setDepartments((prev) => [...prev, created as NamedItem]);
      } else {
        setWarrantyPeriods((prev) => [...prev, created as WarrantyItem]);
      }

      setNameInput("");
      setMonthsInput("12");
      setIsAddOpen(false);
      showToast({ type: "success", message: activeMeta.successAddMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!activeMeta || !activeType) return;

    setIsDeletingId(id);
    try {
      const response = await fetch(`${activeMeta.deleteEndpoint}/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast({
          type: "error",
          message: payload?.error ?? activeMeta.parseDeleteErrorFallback,
        });
        return;
      }

      if (activeType === "category") {
        setCategories((prev) => prev.filter((item) => item.id !== id));
      } else if (activeType === "assetType") {
        setAssetTypes((prev) => prev.filter((item) => item.id !== id));
      } else if (activeType === "department") {
        setDepartments((prev) => prev.filter((item) => item.id !== id));
      } else {
        setWarrantyPeriods((prev) => prev.filter((item) => item.id !== id));
      }
      showToast({ type: "success", message: activeMeta.successDeleteMessage });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 z-[90] -translate-x-1/2">
          <div
            className={`rounded-md border px-4 py-2 text-sm shadow-sm ${
              toast.type === "error"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-green-300 bg-green-50 text-green-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {CONFIG_META.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveType(item.key)}
              className="group inline-flex w-24 flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border surface-card text-gray-900 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-1 text-xs font-medium text-gray-900">{item.label}</div>
            </button>
          );
        })}
      </div>

      {activeMeta && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeMainDialog}
            aria-label={`Close ${activeMeta.label} dialog`}
          />
          <div className="relative w-full max-w-xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border surface-card shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="text-base font-semibold text-gray-900">{activeMeta.listTitle}</div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => setIsAddOpen(true)}>
                    + Add
                  </Button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={closeMainDialog}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
                <div className="space-y-2">
                  {sortedActiveList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {"months" in item ? `${item.name} (${item.months} months)` : item.name}
                      </div>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        onClick={() => onDelete(item.id)}
                        disabled={isDeletingId === item.id}
                      >
                        {isDeletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ))}
                  {sortedActiveList.length === 0 && (
                    <div className="text-sm text-gray-600">No {activeMeta.listTitle.toLowerCase()} found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMeta && isAddOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsAddOpen(false)}
            aria-label={`Close add ${activeMeta.label} dialog`}
          />
          <div className="relative w-full max-w-md px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border surface-card shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="text-base font-semibold text-gray-900">{activeMeta.addTitle}</div>
              </div>
              <form className="space-y-4 px-5 py-4" onSubmit={onCreate}>
                <label className="block text-sm font-medium text-gray-700">
                  {activeMeta.nameLabel}
                  <input
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder={activeMeta.namePlaceholder}
                  />
                </label>

                {activeType === "warranty" && (
                  <label className="block text-sm font-medium text-gray-700">
                    Months
                    <input
                      type="number"
                      min={1}
                      value={monthsInput}
                      onChange={(event) => setMonthsInput(event.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter months (ex: 3, 6, 12)"
                    />
                  </label>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
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
