import { ProductStatus } from "@prisma/client";

export type ProductPayload = {
  product?: string;
  brand?: string;
  snNumber?: string | null;
  sku?: string;
  specification?: string | null;
  orderedDate?: string | null;
  cost?: string | null;
  warrantyPeriodId?: string | null;
  warrantyExpire?: string | null;
  categoryId?: string;
  assetTypeId?: string;
  status?: string;
};

type ProductRow = {
  id: string;
  product: string;
  brand: string;
  snNumber: string | null;
  sku: string;
  specification: string | null;
  orderedDate: Date | null;
  cost: { toString(): string } | null;
  warrantyPeriodId: string | null;
  warrantyExpire: Date | null;
  categoryId: string;
  assetTypeId: string;
  assignedTo: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
  assetType: { id: string; name: string } | null;
  warrantyPeriod: { name: string | null } | null;
  staffAssignments: Array<{
    id: string;
    staff: { name: string | null } | null;
  }>;
};

export const PRODUCT_STATUS_VALUES = new Set<ProductStatus>(
  Object.values(ProductStatus),
);

export const isProductStatus = (value: string): value is ProductStatus =>
  PRODUCT_STATUS_VALUES.has(value as ProductStatus);

export const parseOptionalDateValue = (
  value: string | null | undefined,
  errorMessage: string,
) => {
  if (!value) return { value: null as Date | null };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: errorMessage };
  }

  return { value: parsed };
};

export const parseCostValue = (
  value: string | null | undefined,
  errorMessage = "Invalid cost.",
) => {
  const raw = value != null ? String(value).trim() : "";
  if (!raw) return { value: null as string | null };
  if (!Number.isFinite(Number(raw))) {
    return { error: errorMessage };
  }
  return { value: raw };
};

export const statusNeedsUnassign = (status: ProductStatus) =>
  status === "AVAILABLE" ||
  status === "DAMAGED" ||
  status === "SERVICEABLE" ||
  status === "UNDER_SERVICE";

export const statusReturnReason = (status: ProductStatus) =>
  status === "DAMAGED" || status === "SERVICEABLE" || status === "UNDER_SERVICE"
    ? "DAMAGED"
    : "NOT_NEEDED";

export const statusReturnReasonNote = (status: ProductStatus) => {
  if (status === "DAMAGED") return "Marked damaged via edit";
  if (status === "SERVICEABLE") return "Marked serviceable via edit";
  if (status === "UNDER_SERVICE") return "Sent to service via edit";
  return "Updated via edit";
};

export const getNextSkuNumber = (skus: string[], prefix: string) => {
  let max = 0;
  const strictPattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const loosePattern = /(\d+)\s*$/;

  for (const sku of skus) {
    const strictMatch = sku.match(strictPattern);
    if (strictMatch) {
      max = Math.max(max, Number.parseInt(strictMatch[1] ?? "0", 10));
      continue;
    }

    if (sku.toUpperCase().startsWith(`${prefix.toUpperCase()}-`)) {
      const looseMatch = sku.match(loosePattern);
      if (looseMatch) {
        max = Math.max(max, Number.parseInt(looseMatch[1] ?? "0", 10));
      }
    }
  }

  return max + 1;
};

export const serializeProducts = (products: ProductRow[]) =>
  products
    .map((product) => {
      const { staffAssignments, ...rest } = product;
      const latestAssignment = staffAssignments[0];
      const assignedName = rest.assignedTo ?? latestAssignment?.staff?.name ?? null;
      const activeAssignmentId = latestAssignment?.id ?? null;
      const status =
        assignedName && rest.status === "AVAILABLE" ? "ACTIVE_USE" : rest.status;

      return {
        ...rest,
        assignedTo: assignedName,
        warrantyName: rest.warrantyPeriod?.name ?? null,
        activeAssignmentId,
        status,
      };
    })
    .map((product) => ({
      ...product,
      cost: product.cost ? product.cost.toString() : null,
      orderedDate: product.orderedDate ? product.orderedDate.toISOString() : null,
      warrantyExpire: product.warrantyExpire
        ? product.warrantyExpire.toISOString()
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));
