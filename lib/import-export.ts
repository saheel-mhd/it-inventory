/*
 * The single inventory import.
 *
 * One row describes one physical asset together with everything it belongs to:
 * its department, asset type, category, warranty and the person using it.
 * Anything referenced that does not exist yet is created; anything that already
 * exists is reused, so a department or category named on 90 rows is still only
 * one record.
 *
 * Header matching ignores case and punctuation, so "product_sku", "Product SKU"
 * and "product sku" all resolve to the same column.
 */
export const INVENTORY_COLUMNS = [
  "department_code",
  "department_name",
  "assettype_name",
  "category_name",
  "category_prefix",
  "warranty_code",
  "warranty_name",
  "warrantyin_months",
  "user_name",
  "product_sku",
  "product_name",
  "product_brand",
  "product_snNumber",
  "product_specification",
  "product_quantity",
  "product_status",
  "product_orderedDate",
  "product_cost",
  "product_warrantyExpire",
] as const;

// An asset is meaningless without an identity and a place in the taxonomy.
// Everything else can be filled in later.
export const INVENTORY_REQUIRED_COLUMNS = [
  "product_sku",
  "product_name",
  "category_name",
  "assettype_name",
] as const;

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
      "quantity",
      "categoryName",
      "assetTypeName",
      "status",
      "orderedDate",
      "cost",
      "warrantyPeriodCode",
      "warrantyExpire",
      "departmentCode",
    ],
    requiredColumns: ["sku", "product", "brand", "categoryName", "assetTypeName"],
  },
  staff: {
    label: "Users",
    description: "User list with departments and active status.",
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
