import {
  CategoryOption,
  Option,
  ProductFormErrors,
  ProductFormState,
  ProductStatusOption,
} from "~/app/components/products/product-form-types";

type ProductFormFieldsProps = {
  form: ProductFormState;
  errors: ProductFormErrors;
  categories: CategoryOption[];
  assetTypes: Option[];
  warrantyPeriods: Array<{ id: string; name: string; months: number }>;
  statusOptions?: ProductStatusOption[];
  onFieldChange: (
    field: keyof ProductFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  skuHint?: string;
};

export default function ProductFormFields({
  form,
  errors,
  categories,
  assetTypes,
  warrantyPeriods,
  statusOptions,
  onFieldChange,
  skuHint,
}: ProductFormFieldsProps) {
  const filteredCategories = categories.filter(
    (category) =>
      category.assetTypeId === form.assetTypeId &&
      (category.isActive === undefined || category.isActive),
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700">
        Asset type
        <select
          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
          value={form.assetTypeId}
          onChange={onFieldChange("assetTypeId")}
        >
          <option value="">Select asset type</option>
          {assetTypes
            .filter((assetType) => assetType.isActive ?? true)
            .map((assetType) => (
              <option key={assetType.id} value={assetType.id}>
                {assetType.name}
              </option>
            ))}
        </select>
        {errors.assetTypeId && (
          <div className="mt-1 text-xs text-red-600">{errors.assetTypeId}</div>
        )}
      </label>

      <label className="text-sm font-medium text-gray-700">
        Category
        <select
          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
          value={form.categoryId}
          onChange={onFieldChange("categoryId")}
        >
          <option value="">Select category</option>
          {filteredCategories.map((category) => (
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
        Product name
        <input
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={form.product}
          onChange={onFieldChange("product")}
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
          onChange={onFieldChange("brand")}
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
          onChange={onFieldChange("snNumber")}
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
          onChange={onFieldChange("sku")}
        />
        {skuHint && <div className="mt-1 text-xs text-gray-500">{skuHint}</div>}
        {errors.sku && <div className="mt-1 text-xs text-red-600">{errors.sku}</div>}
      </label>

      <label className="text-sm font-medium text-gray-700">
        Specification
        <input
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={form.specification}
          onChange={onFieldChange("specification")}
        />
      </label>

      <label className="text-sm font-medium text-gray-700">
        Ordered date
        <input
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="date"
          value={form.orderedDate}
          onChange={onFieldChange("orderedDate")}
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
          onChange={onFieldChange("cost")}
        />
      </label>

      <label className="text-sm font-medium text-gray-700">
        Warranty
        <select
          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
          value={form.warrantyPeriodId}
          onChange={onFieldChange("warrantyPeriodId")}
        >
          <option value="">No warranty</option>
          {warrantyPeriods.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
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
          onChange={onFieldChange("warrantyExpire")}
        />
      </label>

      {statusOptions && (
        <label className="text-sm font-medium text-gray-700">
          Status
          <select
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            value={form.status}
            onChange={onFieldChange("status")}
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
      )}
    </div>
  );
}
