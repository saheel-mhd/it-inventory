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
  department?: { name: string } | null;
  category: { id: string; name: string } | null;
  assetType: { id: string; name: string } | null;
  warrantyPeriod: { name: string | null } | null;
  staffAssignments: Array<{
    id: string;
    returnDate?: Date | null;
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
      const target = resolveAssignment({
        assignedTo: rest.assignedTo,
        department: rest.department,
        staffAssignments: staffAssignments.map((item) => ({
          returnDate: item.returnDate ?? null,
          staff: item.staff?.name ? { name: item.staff.name } : null,
        })),
      });
      const activeAssignmentId = latestAssignment?.id ?? null;
      // Only a person holding it makes an asset "in use"; a team owning a spare
      // should not look like someone is using it.
      const status =
        target?.kind === "user" && rest.status === "AVAILABLE"
          ? "ACTIVE_USE"
          : rest.status;

      return {
        ...rest,
        assignedTo: target?.name ?? null,
        assignedToKind: target?.kind ?? null,
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

/**
 * Who an asset currently belongs to.
 *
 * An asset can sit with a named person or with a whole team — a shared meeting
 * room laptop, the security team's radios — so "assigned to" is not always a
 * person's name. Resolved in order of how specific the claim is: someone
 * physically holding it beats a team owning it.
 */
export type AssignmentTarget = {
  name: string;
  kind: "user" | "department";
} | null;

export const resolveAssignment = (product: {
  assignedTo?: string | null;
  department?: { name: string } | null;
  staffAssignments?: Array<{
    returnDate?: Date | null;
    staff?: { name: string } | null;
  }> | null;
}): AssignmentTarget => {
  const open = product.staffAssignments?.find((item) => !item.returnDate);
  if (open?.staff?.name) return { name: open.staff.name, kind: "user" };
  if (product.assignedTo) return { name: product.assignedTo, kind: "user" };
  if (product.department?.name) {
    return { name: product.department.name, kind: "department" };
  }
  return null;
};
