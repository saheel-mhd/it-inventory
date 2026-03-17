"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CONFIG_META } from "~/app/components/settings/configure-grid-config";
import {
  ConfigureFormDialog,
  ConfigureListDialog,
  ConfigureToast,
} from "~/app/components/settings/configure-grid-dialogs";
import {
  ConfigType,
  ConfigureGridProps,
  GenericItem,
  ToastState,
} from "~/app/components/settings/configure-grid-types";

export default function ConfigureGrid({
  initialCategories,
  initialAssetTypes,
  initialDepartments,
  initialWarrantyPeriods,
}: ConfigureGridProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [assetTypes, setAssetTypes] = useState(initialAssetTypes);
  const [departments, setDepartments] = useState(initialDepartments);
  const [warrantyPeriods, setWarrantyPeriods] = useState(initialWarrantyPeriods);
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
      return setCategories((prev) =>
        prev.map((item) => (item.id === id ? (updater(item) as typeof item) : item)),
      );
    }
    if (activeType === "assetType") {
      return setAssetTypes((prev) =>
        prev.map((item) => (item.id === id ? (updater(item) as typeof item) : item)),
      );
    }
    if (activeType === "department") {
      return setDepartments((prev) =>
        prev.map((item) => (item.id === id ? (updater(item) as typeof item) : item)),
      );
    }
    if (activeType === "warranty") {
      return setWarrantyPeriods((prev) =>
        prev.map((item) => (item.id === id ? (updater(item) as typeof item) : item)),
      );
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

  const validateForm = () => {
    if (!activeMeta || !activeType) return "Invalid configuration type.";
    const name = nameInput.trim();
    if (!name) return `${activeMeta.nameLabel} is required.`;
    if (activeType === "category" && !categoryAssetTypeId) {
      return "Asset type is required for category.";
    }
    if (activeType === "warranty") {
      const months = Number(monthsInput);
      if (!Number.isInteger(months) || months <= 0) {
        return "Months must be a positive whole number.";
      }
    }
    return "";
  };

  const buildBody = () =>
    activeType === "warranty"
      ? { name: nameInput.trim(), months: Number(monthsInput) }
      : activeType === "category"
        ? {
            name: nameInput.trim(),
            assetTypeId: categoryAssetTypeId,
            prefix: prefixInput.trim() || null,
          }
        : { name: nameInput.trim() };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeMeta || !activeType) return;
    const validationError = validateForm();
    if (validationError) return showToast({ type: "error", message: validationError });

    setIsSaving(true);
    try {
      const response = await fetch(activeMeta.createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast({ type: "error", message: payload?.error ?? `Failed to add ${activeMeta.label}.` });
        return;
      }

      if (activeType === "category") setCategories((prev) => [...prev, payload.category]);
      if (activeType === "assetType") setAssetTypes((prev) => [...prev, payload.assetType]);
      if (activeType === "department") setDepartments((prev) => [...prev, payload.department]);
      if (activeType === "warranty") setWarrantyPeriods((prev) => [...prev, payload.warrantyPeriod]);

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
    const validationError = validateForm();
    if (validationError) return showToast({ type: "error", message: validationError });

    setIsSaving(true);
    try {
      const response = await fetch(`${activeMeta.itemEndpoint}/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast({ type: "error", message: payload?.error ?? `Failed to update ${activeMeta.label}.` });
        return;
      }

      if (activeType === "category") patchListItem(editingItem.id, () => payload.category);
      if (activeType === "assetType") patchListItem(editingItem.id, () => payload.assetType);
      if (activeType === "department") patchListItem(editingItem.id, () => payload.department);
      if (activeType === "warranty") patchListItem(editingItem.id, () => payload.warrantyPeriod);

      resetFormState();
      showToast({ type: "success", message: activeMeta.successEditMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleActive = async (item: GenericItem) => {
    if (!activeMeta) return;
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
      <ConfigureToast toast={toast} />

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

      <ConfigureListDialog
        activeMeta={activeMeta}
        sortedActiveList={sortedActiveList}
        isTogglingId={isTogglingId}
        onClose={closeMainDialog}
        onOpenAdd={onOpenAdd}
        onOpenEdit={onOpenEdit}
        onToggleActive={onToggleActive}
      />

      {activeMeta && (
        <>
          <ConfigureFormDialog
            open={isAddOpen}
            title={activeMeta.addTitle}
            activeType={activeType!}
            activeMeta={activeMeta}
            nameInput={nameInput}
            prefixInput={prefixInput}
            categoryAssetTypeId={categoryAssetTypeId}
            monthsInput={monthsInput}
            assetTypes={assetTypes}
            isSaving={isSaving}
            onClose={() => setIsAddOpen(false)}
            onNameChange={setNameInput}
            onPrefixChange={setPrefixInput}
            onAssetTypeChange={setCategoryAssetTypeId}
            onMonthsChange={setMonthsInput}
            onSubmit={onCreate}
          />
          <ConfigureFormDialog
            open={Boolean(editingItem)}
            title={activeMeta.editTitle}
            activeType={activeType!}
            activeMeta={activeMeta}
            nameInput={nameInput}
            prefixInput={prefixInput}
            categoryAssetTypeId={categoryAssetTypeId}
            monthsInput={monthsInput}
            assetTypes={assetTypes}
            isSaving={isSaving}
            onClose={resetFormState}
            onNameChange={setNameInput}
            onPrefixChange={setPrefixInput}
            onAssetTypeChange={setCategoryAssetTypeId}
            onMonthsChange={setMonthsInput}
            onSubmit={onEdit}
          />
        </>
      )}
    </>
  );
}
