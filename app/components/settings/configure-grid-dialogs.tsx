import Button from "~/app/components/ui/button";
import {
  IconBan,
  IconCheck,
  IconPencil,
} from "~/app/components/ui/icons";
import {
  ConfigMeta,
  ConfigType,
  GenericItem,
  NamedItem,
  ToastState,
} from "~/app/components/settings/configure-grid-types";

type ConfigureToastProps = {
  toast: ToastState;
};

type ConfigureListDialogProps = {
  activeMeta: ConfigMeta | null;
  sortedActiveList: GenericItem[];
  isTogglingId: string | null;
  onClose: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (item: GenericItem) => void;
  onToggleActive: (item: GenericItem) => void;
};

type ConfigureFormDialogProps = {
  open: boolean;
  title: string;
  activeType: ConfigType;
  activeMeta: ConfigMeta;
  nameInput: string;
  prefixInput: string;
  categoryAssetTypeId: string;
  monthsInput: string;
  assetTypes: NamedItem[];
  isSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onAssetTypeChange: (value: string) => void;
  onMonthsChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const renderItemLabel = (item: GenericItem) => {
  if ("months" in item) return `${item.name} (${item.months} months)`;
  if ("assetTypeName" in item) {
    return `${item.name}${item.prefix ? ` [${item.prefix}]` : ""} (${item.assetTypeName ?? "No asset type"})`;
  }
  return item.name;
};

export function ConfigureToast({ toast }: ConfigureToastProps) {
  if (!toast) return null;

  return (
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
  );
}

export function ConfigureListDialog({
  activeMeta,
  sortedActiveList,
  isTogglingId,
  onClose,
  onOpenAdd,
  onOpenEdit,
  onToggleActive,
}: ConfigureListDialogProps) {
  if (!activeMeta) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} />
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
                onClick={onClose}
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
                      {renderItemLabel(item)}
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
                        item.isActive
                          ? "text-red-700 hover:bg-red-50"
                          : "text-green-700 hover:bg-green-50"
                      }`}
                      onClick={() => onToggleActive(item)}
                      disabled={isTogglingId === item.id}
                    >
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1">
                          <IconBan className="h-4 w-4" />
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <IconCheck className="h-4 w-4" />
                          Active
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {sortedActiveList.length === 0 && (
                <div className="text-sm text-gray-600">
                  No {activeMeta.listTitle.toLowerCase()} found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfigureFormDialog({
  open,
  title,
  activeType,
  activeMeta,
  nameInput,
  prefixInput,
  categoryAssetTypeId,
  monthsInput,
  assetTypes,
  isSaving,
  onClose,
  onNameChange,
  onPrefixChange,
  onAssetTypeChange,
  onMonthsChange,
  onSubmit,
}: ConfigureFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md px-4" role="dialog" aria-modal="true">
        <div className="rounded-2xl border surface-card shadow-xl">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="text-base font-semibold text-gray-900">{title}</div>
          </div>
          <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              {activeMeta.nameLabel}
              <input
                value={nameInput}
                onChange={(event) => onNameChange(event.target.value)}
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
                    onChange={(event) => onPrefixChange(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ex: LAP, LPT"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Asset Type
                  <select
                    value={categoryAssetTypeId}
                    onChange={(event) => onAssetTypeChange(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  >
                    <option value="">Select asset type</option>
                    {assetTypes
                      .filter((item) => item.isActive)
                      .map((assetType) => (
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
                  onChange={(event) => onMonthsChange(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                onClick={onClose}
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
  );
}
