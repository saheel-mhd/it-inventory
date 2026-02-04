"use client";

import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import Button from "~/app/components/ui/button";
import {
  IconAssetType,
  IconBan,
  IconCategory,
  IconCheck,
  IconDepartment,
  IconPencil,
  IconWarranty,
} from "~/app/components/ui/icons";

type NamedItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type CategoryItem = NamedItem & {
  assetTypeName: string | null;
  prefix?: string | null;
};

type WarrantyItem = NamedItem & {
  months: number;
};

type ConfigureGridProps = {
  initialCategories: CategoryItem[];
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
  editTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  createEndpoint: string;
  itemEndpoint: string;
  successAddMessage: string;
  successEditMessage: string;
  successInactiveMessage: string;
  successActiveMessage: string;
};

const CONFIG_META: ConfigMeta[] = [
  {
    key: "category",
    label: "Category",
    icon: IconCategory,
    listTitle: "Categories",
    addTitle: "Add Category",
    editTitle: "Edit Category",
    nameLabel: "Category Name",
    namePlaceholder: "Enter category name",
    createEndpoint: "/api/categories",
    itemEndpoint: "/api/categories",
    successAddMessage: "Category added.",
    successEditMessage: "Category updated.",
    successInactiveMessage: "Category set inactive.",
    successActiveMessage: "Category set active.",
  },
  {
    key: "assetType",
    label: "Asset Type",
    icon: IconAssetType,
    listTitle: "Asset Types",
    addTitle: "Add Asset Type",
    editTitle: "Edit Asset Type",
    nameLabel: "Asset Type Name",
    namePlaceholder: "Enter asset type name",
    createEndpoint: "/api/asset-types",
    itemEndpoint: "/api/asset-types",
    successAddMessage: "Asset type added.",
    successEditMessage: "Asset type updated.",
    successInactiveMessage: "Asset type set inactive.",
    successActiveMessage: "Asset type set active.",
  },
  {
    key: "department",
    label: "Department",
    icon: IconDepartment,
    listTitle: "Departments",
    addTitle: "Add Department",
    editTitle: "Edit Department",
    nameLabel: "Department Name",
    namePlaceholder: "Enter department name",
    createEndpoint: "/api/departments",
    itemEndpoint: "/api/departments",
    successAddMessage: "Department added.",
    successEditMessage: "Department updated.",
    successInactiveMessage: "Department set inactive.",
    successActiveMessage: "Department set active.",
  },
  {
    key: "warranty",
    label: "Warranty",
    icon: IconWarranty,
    listTitle: "Warranty Periods",
    addTitle: "Add Warranty Period",
    editTitle: "Edit Warranty Period",
    nameLabel: "Warranty Name",
    namePlaceholder: 'Enter warranty name (ex: "3 months")',
    createEndpoint: "/api/warranty-periods",
    itemEndpoint: "/api/warranty-periods",
    successAddMessage: "Warranty period added.",
    successEditMessage: "Warranty period updated.",
    successInactiveMessage: "Warranty period set inactive.",
    successActiveMessage: "Warranty period set active.",
  },
];

type GenericItem = NamedItem | CategoryItem | WarrantyItem;

export default function ConfigureGrid({
  initialCategories,
  initialAssetTypes,
  initialDepartments,
  initialWarrantyPeriods,
}: ConfigureGridProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [assetTypes, setAssetTypes] = useState<NamedItem[]>(initialAssetTypes);
  const [departments, setDepartments] = useState<NamedItem[]>(initialDepartments);
  const [warrantyPeriods, setWarrantyPeriods] = useState<WarrantyItem[]>(initialWarrantyPeriods);
  const [activeType, setActiveType] = useState<ConfigType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [prefixInput, setPrefixInput] = useState("");
  const [categoryAssetTypeId, setCategoryAssetTypeId] = useState("");
  const [monthsInput, setMonthsInput] = useState("12");
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const activeMeta = useMemo(
    () => CONFIG_META.find((item) => item.key === activeType) ?? null,
    [activeType],
  );

  const activeList = useMemo<GenericItem[]>(() => {
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

  const editingItem = useMemo(
    () => (editItemId ? activeList.find((item) => item.id === editItemId) ?? null : null),
    [activeList, editItemId],
  );

  const showToast = (next: ToastState) => {
    setToast(next);
    setTimeout(() => setToast(null), 2800);
  };

  const resetFormState = () => {
    setNameInput("");
    setPrefixInput("");
    setCategoryAssetTypeId("");
    setMonthsInput("12");
    setEditItemId(null);
  };

  const closeMainDialog = () => {
    setActiveType(null);
    setIsAddOpen(false);
    resetFormState();
  };

  const patchListItem = (id: string, updater: (prev: GenericItem) => GenericItem) => {
    if (activeType === "category") {
      setCategories((prev) => prev.map((item) => (item.id === id ? (updater(item) as CategoryItem) : item)));
      return;
    }
    if (activeType === "assetType") {
      setAssetTypes((prev) => prev.map((item) => (item.id === id ? (updater(item) as NamedItem) : item)));
      return;
    }
    if (activeType === "department") {
      setDepartments((prev) => prev.map((item) => (item.id === id ? (updater(item) as NamedItem) : item)));
      return;
    }
    if (activeType === "warranty") {
      setWarrantyPeriods((prev) => prev.map((item) => (item.id === id ? (updater(item) as WarrantyItem) : item)));
    }
  };

  const onOpenAdd = () => {
    resetFormState();
    setIsAddOpen(true);
  };

  const onOpenEdit = (item: GenericItem) => {
    setIsAddOpen(false);
    setEditItemId(item.id);
    setNameInput(item.name);
    if ("months" in item) setMonthsInput(String(item.months));
    if ("assetTypeName" in item) {
      const matched = assetTypes.find((assetType) => assetType.name === item.assetTypeName);
      setCategoryAssetTypeId(matched?.id ?? "");
      setPrefixInput(item.prefix ?? "");
    }
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeMeta || !activeType) return;

    const name = nameInput.trim();
    if (!name) return showToast({ type: "error", message: `${activeMeta.nameLabel} is required.` });
    if (activeType === "category" && !categoryAssetTypeId) {
      return showToast({ type: "error", message: "Asset type is required for category." });
    }
    if (activeType === "warranty") {
      const months = Number(monthsInput);
      if (!Number.isInteger(months) || months <= 0) {
        return showToast({ type: "error", message: "Months must be a positive whole number." });
      }
    }

    const body =
      activeType === "warranty"
        ? { name, months: Number(monthsInput) }
        : activeType === "category"
          ? { name, assetTypeId: categoryAssetTypeId, prefix: prefixInput.trim() || null }
          : { name };

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

      if (activeType === "category") {
        setCategories((prev) => [...prev, payload.category]);
      } else if (activeType === "assetType") {
        setAssetTypes((prev) => [...prev, payload.assetType]);
      } else if (activeType === "department") {
        setDepartments((prev) => [...prev, payload.department]);
      } else {
        setWarrantyPeriods((prev) => [...prev, payload.warrantyPeriod]);
      }

      resetFormState();
      setIsAddOpen(false);
      showToast({ type: "success", message: activeMeta.successAddMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeMeta || !activeType || !editingItem) return;

    const name = nameInput.trim();
    if (!name) return showToast({ type: "error", message: `${activeMeta.nameLabel} is required.` });

    const body: Record<string, unknown> = { name };
    if (activeType === "category") {
      if (!categoryAssetTypeId) {
        return showToast({ type: "error", message: "Asset type is required for category." });
      }
      body.assetTypeId = categoryAssetTypeId;
      body.prefix = prefixInput.trim() || null;
    }
    if (activeType === "warranty") {
      const months = Number(monthsInput);
      if (!Number.isInteger(months) || months <= 0) {
        return showToast({ type: "error", message: "Months must be a positive whole number." });
      }
      body.months = months;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${activeMeta.itemEndpoint}/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast({ type: "error", message: payload?.error ?? `Failed to update ${activeMeta.label}.` });
        return;
      }

      if (activeType === "category") {
        patchListItem(editingItem.id, () => payload.category);
      } else if (activeType === "assetType") {
        patchListItem(editingItem.id, () => payload.assetType);
      } else if (activeType === "department") {
        patchListItem(editingItem.id, () => payload.department);
      } else {
        patchListItem(editingItem.id, () => payload.warrantyPeriod);
      }
      resetFormState();
      showToast({ type: "success", message: activeMeta.successEditMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleActive = async (item: GenericItem) => {
    if (!activeMeta || !activeType) return;
    const nextActive = !item.isActive;
    setIsTogglingId(item.id);
    try {
      const response = await fetch(`${activeMeta.itemEndpoint}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast({ type: "error", message: payload?.error ?? `Failed to update ${activeMeta.label}.` });
        return;
      }
      patchListItem(item.id, (prev) => ({ ...prev, isActive: nextActive }));
      showToast({
        type: "success",
        message: nextActive ? activeMeta.successActiveMessage : activeMeta.successInactiveMessage,
      });
    } finally {
      setIsTogglingId(null);
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
          <button type="button" className="absolute inset-0 bg-black/40" onClick={closeMainDialog} />
          <div className="relative w-full max-w-xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border surface-card shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="text-base font-semibold text-gray-900">{activeMeta.listTitle}</div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={onOpenAdd}>
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
                        <span className={item.isActive ? "" : "text-gray-400 line-through"}>
                          {"months" in item
                            ? `${item.name} (${item.months} months)`
                            : "assetTypeName" in item
                              ? `${item.name}${item.prefix ? ` [${item.prefix}]` : ""} (${item.assetTypeName ?? "No asset type"})`
                              : item.name}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100"
                          onClick={() => onOpenEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            item.isActive ? "text-red-700 hover:bg-red-50" : "text-green-700 hover:bg-green-50"
                          }`}
                          onClick={() => onToggleActive(item)}
                          disabled={isTogglingId === item.id}
                        >
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1"><IconBan className="h-4 w-4" />Inactive</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><IconCheck className="h-4 w-4" />Active</span>
                          )}
                        </button>
                      </div>
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
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setIsAddOpen(false)} />
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

                {activeType === "category" && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Category Prefix (for SKU)
                      <input
                        value={prefixInput}
                        onChange={(event) => setPrefixInput(event.target.value)}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ex: LAP, LPT"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Asset Type
                      <select
                        value={categoryAssetTypeId}
                        onChange={(event) => setCategoryAssetTypeId(event.target.value)}
                        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      >
                        <option value="">Select asset type</option>
                        {assetTypes.filter((item) => item.isActive).map((assetType) => (
                          <option key={assetType.id} value={assetType.id}>
                            {assetType.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {activeType === "warranty" && (
                  <label className="block text-sm font-medium text-gray-700">
                    Months
                    <input
                      type="number"
                      min={1}
                      value={monthsInput}
                      onChange={(event) => setMonthsInput(event.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

      {activeMeta && editingItem && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={resetFormState} />
          <div className="relative w-full max-w-md px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl border surface-card shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="text-base font-semibold text-gray-900">{activeMeta.editTitle}</div>
              </div>
              <form className="space-y-4 px-5 py-4" onSubmit={onEdit}>
                <label className="block text-sm font-medium text-gray-700">
                  {activeMeta.nameLabel}
                  <input
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {activeType === "category" && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Category Prefix (for SKU)
                      <input
                        value={prefixInput}
                        onChange={(event) => setPrefixInput(event.target.value)}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ex: LAP, LPT"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Asset Type
                      <select
                        value={categoryAssetTypeId}
                        onChange={(event) => setCategoryAssetTypeId(event.target.value)}
                        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                      >
                        <option value="">Select asset type</option>
                        {assetTypes.map((assetType) => (
                          <option key={assetType.id} value={assetType.id}>
                            {assetType.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {activeType === "warranty" && (
                  <label className="block text-sm font-medium text-gray-700">
                    Months
                    <input
                      type="number"
                      min={1}
                      value={monthsInput}
                      onChange={(event) => setMonthsInput(event.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={resetFormState}
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
