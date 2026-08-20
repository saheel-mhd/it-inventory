import { ProductStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma";
import type { CurrentAdmin } from "~/server/auth/session";
import { createActorCreateFields, createActorUpdateFields, } from "~/server/services/audit-log";
import { isProductStatus, normalizeLookup, parseDate, parseNumber, STATUS_VALUES, toOptionalText, toText, } from "~/server/services/import-utils";


export type ImportCounts = {
  departments: number;
  assetTypes: number;
  categories: number;
  warranties: number;
  users: number;
  products: number;
  assignments: number;
  returns: number;
};

export type ImportCaches = {
  department: Map<string, string>;
  assetType: Map<string, string>;
  category: Map<string, string>;
  warranty: Map<string, string>;
  staff: Map<string, string>;
};

export const emptyCounts = (): ImportCounts => ({
  departments: 0,
  assetTypes: 0,
  categories: 0,
  warranties: 0,
  users: 0,
  products: 0,
  assignments: 0,
  returns: 0,
});

export const emptyCaches = (): ImportCaches => ({
  department: new Map(),
  assetType: new Map(),
  category: new Map(),
  warranty: new Map(),
  staff: new Map(),
});

export type RowContext = {
  actor: CurrentAdmin;
  caches: ImportCaches;
  counts: ImportCounts;
};

const deriveCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

async function resolveAssetType(name: string, ctx: RowContext) {
  const key = normalizeLookup(name);
  const cached = ctx.caches.assetType.get(key);
  if (cached) return cached;

  const existing = await prisma.assetType.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    ctx.caches.assetType.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.assetType.create({
    data: { name, ...createActorCreateFields(ctx.actor) },
    select: { id: true },
  });
  ctx.counts.assetTypes += 1;
  ctx.caches.assetType.set(key, created.id);
  return created.id;
}

async function resolveDepartment(code: string, name: string, ctx: RowContext) {
  // A row may name a department by either column; both point at one record.
  const effectiveName = name || code;
  const effectiveCode = code ? deriveCode(code) : deriveCode(effectiveName);
  const key = normalizeLookup(effectiveCode);

  const cached = ctx.caches.department.get(key);
  if (cached) return cached;

  const existing = await prisma.departmentModel.findFirst({
    where: {
      OR: [
        { code: { equals: effectiveCode, mode: "insensitive" } },
        { name: { equals: effectiveName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    ctx.caches.department.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.departmentModel.create({
    data: {
      code: effectiveCode,
      name: effectiveName,
      ...createActorCreateFields(ctx.actor),
    },
    select: { id: true },
  });
  ctx.counts.departments += 1;
  ctx.caches.department.set(key, created.id);
  return created.id;
}

async function resolveCategory(
  name: string,
  prefix: string | null,
  assetTypeId: string,
  ctx: RowContext,
) {
  const key = normalizeLookup(name);
  const cached = ctx.caches.category.get(key);
  if (cached) return cached;

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, prefix: true, assetTypeId: true },
  });
  if (existing) {

    const patch: { prefix?: string; assetTypeId?: string } = {};
    if (prefix && !existing.prefix) patch.prefix = prefix;
    if (!existing.assetTypeId) patch.assetTypeId = assetTypeId;
    if (Object.keys(patch).length > 0) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { ...patch, ...createActorUpdateFields(ctx.actor) },
      });
    }
    ctx.caches.category.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.category.create({
    data: {
      name,
      prefix: prefix || null,
      assetTypeId,
      ...createActorCreateFields(ctx.actor),
    },
    select: { id: true },
  });
  ctx.counts.categories += 1;
  ctx.caches.category.set(key, created.id);
  return created.id;
}

async function resolveWarranty(
  code: string,
  name: string,
  months: number | null,
  ctx: RowContext,
) {
  if (!code && !name) return null;

  const effectiveName = name || code;
  const key = normalizeLookup(code || effectiveName);
  const cached = ctx.caches.warranty.get(key);
  if (cached) return cached;

  const or = [];
  if (code) or.push({ code: { equals: code, mode: "insensitive" as const } });
  if (effectiveName) {
    or.push({ name: { equals: effectiveName, mode: "insensitive" as const } });
  }
  const existing = await prisma.warrantyPeriodModel.findFirst({
    where: { OR: or },
    select: { id: true },
  });
  if (existing) {
    ctx.caches.warranty.set(key, existing.id);
    return existing.id;
  }

  if (months == null) {
    throw new Error(
      `Warranty "${effectiveName}" does not exist yet, so warrantyin_months is required to create it.`,
    );
  }

  const created = await prisma.warrantyPeriodModel.create({
    data: {
      code: code ? deriveCode(code) : `${deriveCode(effectiveName)}_${months}`,
      name: effectiveName,
      months: Math.trunc(months),
      ...createActorCreateFields(ctx.actor),
    },
    select: { id: true },
  });
  ctx.counts.warranties += 1;
  ctx.caches.warranty.set(key, created.id);
  return created.id;
}

async function resolveStaff(name: string, departmentId: string, ctx: RowContext) {
  const key = `${normalizeLookup(name)}::${departmentId}`;
  const cached = ctx.caches.staff.get(key);
  if (cached) return cached;

  const existing = await prisma.staff.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, departmentId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    ctx.caches.staff.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.staff.create({
    data: { name, departmentId, ...createActorCreateFields(ctx.actor) },
    select: { id: true },
  });
  ctx.counts.users += 1;
  ctx.caches.staff.set(key, created.id);
  return created.id;
}

async function reconcileAssignment(
  productId: string,
  staffId: string | null,
  startDate: Date,
  ctx: RowContext,
) {
  const open = await prisma.staffInventory.findFirst({
    where: { productId, returnDate: null },
    orderBy: { startDate: "desc" },
    select: { id: true, staffId: true },
  });

  if (open && open.staffId === staffId) return;

  if (open) {
    await prisma.staffInventory.update({
      where: { id: open.id },
      data: { returnDate: new Date(), ...createActorUpdateFields(ctx.actor) },
    });
    ctx.counts.returns += 1;
  }

  if (staffId) {
    await prisma.staffInventory.create({
      data: {
        productId,
        staffId,
        startDate,
        ...createActorCreateFields(ctx.actor),
      },
    });
    ctx.counts.assignments += 1;
  }
}

export type InventoryRowResult = "created" | "updated";

export async function importInventoryRow(
  rowData: Record<string, unknown>,
  ctx: RowContext,
): Promise<InventoryRowResult> {
  const sku = toText(rowData.product_sku);
  const productName = toText(rowData.product_name);
  const categoryName = toText(rowData.category_name);
  const assetTypeName = toText(rowData.assettype_name);

  if (!sku) throw new Error("product_sku is required.");
  if (!productName) throw new Error("product_name is required.");
  if (!categoryName) throw new Error("category_name is required.");
  if (!assetTypeName) throw new Error("assettype_name is required.");

  const brand = toText(rowData.product_brand) || "General";

  const departmentCode = toText(rowData.department_code);
  const departmentName = toText(rowData.department_name);
  const userName = toText(rowData.user_name);

  let departmentId: string | null = null;
  if (departmentCode || departmentName) {
    departmentId = await resolveDepartment(departmentCode, departmentName, ctx);
  }

  if (userName && !departmentId) {
    throw new Error(
      `user_name "${userName}" needs a department — fill in department_code or department_name on this row.`,
    );
  }

  const assetTypeId = await resolveAssetType(assetTypeName, ctx);
  const categoryId = await resolveCategory(
    categoryName,
    toOptionalText(rowData.category_prefix),
    assetTypeId,
    ctx,
  );

  const months = parseNumber(rowData.warrantyin_months);
  if (months.error) throw new Error(months.error);
  const warrantyPeriodId = await resolveWarranty(
    toText(rowData.warranty_code),
    toText(rowData.warranty_name),
    months.value ?? null,
    ctx,
  );

  const staffId = userName ? await resolveStaff(userName, departmentId!, ctx) : null;

  const orderedDate = parseDate(rowData.product_orderedDate);
  if (orderedDate.error) throw new Error(orderedDate.error);
  const warrantyExpire = parseDate(rowData.product_warrantyExpire);
  if (warrantyExpire.error) throw new Error(warrantyExpire.error);

  const cost = parseNumber(rowData.product_cost);
  if (cost.error) throw new Error(cost.error);

  const quantity = parseNumber(rowData.product_quantity);
  if (quantity.error) throw new Error(quantity.error);
  if (quantity.value != null && (!Number.isInteger(quantity.value) || quantity.value < 1)) {
    throw new Error(
      `Invalid product_quantity "${rowData.product_quantity}". Use a whole number of 1 or more.`,
    );
  }

  const statusRaw = toText(rowData.product_status);
  let status: ProductStatus;
  if (statusRaw) {
    const normalized = statusRaw.toUpperCase().replace(/[\s-]+/g, "_");
    // Wording people actually type in spreadsheets.
    const alias: Record<string, ProductStatus> = {
      IN_USE: ProductStatus.ACTIVE_USE,
      ACTIVE: ProductStatus.ACTIVE_USE,
      ASSIGNED: ProductStatus.ACTIVE_USE,
      INVENTORY: ProductStatus.AVAILABLE,
      IN_STOCK: ProductStatus.AVAILABLE,
      STOCK: ProductStatus.AVAILABLE,
      SPARE: ProductStatus.AVAILABLE,
      IN_SERVICE: ProductStatus.UNDER_SERVICE,
      REPAIR: ProductStatus.UNDER_SERVICE,
      BROKEN: ProductStatus.DAMAGED,
    };
    const resolved = alias[normalized] ?? normalized;
    if (!isProductStatus(resolved)) {
      throw new Error(
        `Invalid product_status "${statusRaw}". Use ${Array.from(STATUS_VALUES).join(", ")}.`,
      );
    }
    status = resolved;
  } else {
    status = staffId ? ProductStatus.ACTIVE_USE : ProductStatus.AVAILABLE;
  }

  const snNumber = toOptionalText(rowData.product_snNumber);

  const data = {
    sku,
    product: productName,
    brand,
    snNumber,
    specification: toOptionalText(rowData.product_specification),
    quantity: quantity.value ?? 1,
    categoryId,
    assetTypeId,
    departmentId,
    warrantyPeriodId,
    status,
    orderedDate: orderedDate.value,
    warrantyExpire: warrantyExpire.value,
    cost: cost.value != null ? cost.value.toString() : null,
  };

  let existing: { id: string } | null = null;
  if (snNumber) {
    existing = await prisma.product.findUnique({
      where: { snNumber },
      select: { id: true },
    });
  }
  if (!existing) {
    existing = await prisma.product.findFirst({
      where: { sku },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
  }

  let productId: string;
  let outcome: InventoryRowResult;
  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { ...data, ...createActorUpdateFields(ctx.actor) },
    });
    productId = existing.id;
    outcome = "updated";
  } else {
    const created = await prisma.product.create({
      data: { ...data, ...createActorCreateFields(ctx.actor) },
      select: { id: true },
    });
    productId = created.id;
    ctx.counts.products += 1;
    outcome = "created";
  }

  await reconcileAssignment(productId, staffId, orderedDate.value ?? new Date(), ctx);

  return outcome;
}
