export type DatasetKey =
  | "products"
  | "staff"
  | "categories"
  | "assetTypes"
  | "departments"
  | "warrantyPeriods";

type DatasetDefinition = {
  label: string;
  columns: string[];
  requiredColumns: string[];
  description: string;
};

export const DATASET_DEFINITIONS: Record<DatasetKey, DatasetDefinition> = {
  products: {
    label: "Products",
    description:
      "Inventory items with SKU, brand, category, warranty, and status.",
    columns: [
      "sku",
      "product",
      "brand",
      "snNumber",
      "specification",
      "categoryName",
      "assetTypeName",
      "status",
      "orderedDate",
      "cost",
      "warrantyPeriodCode",
      "warrantyExpire",
    ],
    requiredColumns: ["sku", "product", "brand", "categoryName", "assetTypeName"],
  },
  staff: {
    label: "Staff",
    description: "Staff list with departments and active status.",
    columns: ["name", "departmentCode", "isActive"],
    requiredColumns: ["name", "departmentCode"],
  },
  categories: {
    label: "Categories",
    description: "Product categories with optional prefixes and asset types.",
    columns: ["name", "prefix", "assetTypeName", "isActive"],
    requiredColumns: ["name"],
  },
  assetTypes: {
    label: "Asset Types",
    description: "Asset type master data.",
    columns: ["name", "isActive"],
    requiredColumns: ["name"],
  },
  departments: {
    label: "Departments",
    description: "Department codes and names.",
    columns: ["code", "name", "isActive"],
    requiredColumns: ["code", "name"],
  },
  warrantyPeriods: {
    label: "Warranty Periods",
    description: "Warranty duration master data.",
    columns: ["code", "name", "months", "isActive"],
    requiredColumns: ["code", "name", "months"],
  },
};
