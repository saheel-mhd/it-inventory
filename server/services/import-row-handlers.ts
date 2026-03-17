import { ProductStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma";
import type { DatasetKey } from "~/lib/import-export";
import type { CurrentAdmin } from "~/server/auth/session";
import {
  createActorCreateFields,
  createActorUpdateFields,
} from "~/server/services/audit-log";
import type { ImportLookups } from "~/server/services/import-utils";
import {
  isProductStatus,
  normalizeLookup,
  parseBoolean,
  parseDate,
  parseNumber,
  STATUS_VALUES,
  toOptionalText,
  toText,
} from "~/server/services/import-utils";

type RowHandlerArgs = {
  actor: CurrentAdmin;
  entity: DatasetKey;
  rowData: Record<string, unknown>;
  lookups: ImportLookups;
};

const importCategoryRow = async ({ actor, rowData, lookups }: RowHandlerArgs) => {
  const name = toText(rowData.name);
  if (!name) throw new Error("Name is required.");

  const prefix = toOptionalText(rowData.prefix);
  const assetTypeName = toOptionalText(rowData.assetTypeName);
  const assetTypeId = assetTypeName
    ? lookups.assetTypeMap.get(normalizeLookup(assetTypeName))
    : null;
  if (assetTypeName && !assetTypeId) {
    throw new Error(`Asset type "${assetTypeName}" not found.`);
  }

  const isActive = parseBoolean(rowData.isActive);
  if (isActive.error) throw new Error(isActive.error);

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    await prisma.category.update({
      where: { id: existing.id },
      data: {
        prefix,
        assetTypeId,
        ...(isActive.value == null ? {} : { isActive: isActive.value }),
        ...createActorUpdateFields(actor),
      },
    });
    return "updated";
  }

  await prisma.category.create({
    data: {
      name,
      prefix,
      assetTypeId,
      isActive: isActive.value ?? true,
      ...createActorCreateFields(actor),
    },
  });
  return "created";
};

const importAssetTypeRow = async ({ actor, rowData }: RowHandlerArgs) => {
  const name = toText(rowData.name);
  if (!name) throw new Error("Name is required.");

  const isActive = parseBoolean(rowData.isActive);
  if (isActive.error) throw new Error(isActive.error);

  const existing = await prisma.assetType.findUnique({ where: { name } });
  if (existing) {
    await prisma.assetType.update({
      where: { id: existing.id },
      data: {
        ...(isActive.value == null ? {} : { isActive: isActive.value }),
        ...createActorUpdateFields(actor),
      },
    });
    return "updated";
  }

  await prisma.assetType.create({
    data: { name, isActive: isActive.value ?? true, ...createActorCreateFields(actor) },
  });
  return "created";
};

const importDepartmentRow = async ({ actor, rowData }: RowHandlerArgs) => {
  const code = toText(rowData.code);
  const name = toText(rowData.name);
  if (!code) throw new Error("Code is required.");
  if (!name) throw new Error("Name is required.");

  const isActive = parseBoolean(rowData.isActive);
  if (isActive.error) throw new Error(isActive.error);

  const existing = await prisma.departmentModel.findUnique({
    where: { code },
    select: { id: true },
  });
  if (existing) {
    await prisma.departmentModel.update({
      where: { id: existing.id },
      data: {
        name,
        ...(isActive.value == null ? {} : { isActive: isActive.value }),
        ...createActorUpdateFields(actor),
      },
    });
    return "updated";
  }

  await prisma.departmentModel.create({
    data: { code, name, isActive: isActive.value ?? true, ...createActorCreateFields(actor) },
  });
  return "created";
};

const importWarrantyRow = async ({ actor, rowData }: RowHandlerArgs) => {
  const code = toText(rowData.code);
  const name = toText(rowData.name);
  if (!code) throw new Error("Code is required.");
  if (!name) throw new Error("Name is required.");

  const months = parseNumber(rowData.months);
  if (months.error) throw new Error(months.error);
  if (months.value == null) throw new Error("Months is required.");

  const isActive = parseBoolean(rowData.isActive);
  if (isActive.error) throw new Error(isActive.error);

  const existing = await prisma.warrantyPeriodModel.findUnique({
    where: { code },
    select: { id: true },
  });
  if (existing) {
    await prisma.warrantyPeriodModel.update({
      where: { id: existing.id },
      data: {
        name,
        months: Math.trunc(months.value),
        ...(isActive.value == null ? {} : { isActive: isActive.value }),
        ...createActorUpdateFields(actor),
      },
    });
    return "updated";
  }

  await prisma.warrantyPeriodModel.create({
    data: {
      code,
      name,
      months: Math.trunc(months.value),
      isActive: isActive.value ?? true,
      ...createActorCreateFields(actor),
    },
  });
  return "created";
};

const importStaffRow = async ({ actor, rowData, lookups }: RowHandlerArgs) => {
  const name = toText(rowData.name);
  const departmentCode = toText(rowData.departmentCode);
  if (!name) throw new Error("Name is required.");
  if (!departmentCode) throw new Error("Department code is required.");

  const departmentId = lookups.departmentMap.get(normalizeLookup(departmentCode));
  if (!departmentId) {
    throw new Error(`Department "${departmentCode}" not found.`);
  }

  const isActive = parseBoolean(rowData.isActive);
  if (isActive.error) throw new Error(isActive.error);

  const existing = await prisma.staff.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      departmentId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    await prisma.staff.update({
      where: { id: existing.id },
      data: {
        name,
        ...(isActive.value == null ? {} : { isActive: isActive.value }),
        ...createActorUpdateFields(actor),
      },
    });
    return "updated";
  }

  await prisma.staff.create({
    data: {
      name,
      departmentId,
      isActive: isActive.value ?? true,
      ...createActorCreateFields(actor),
    },
  });
  return "created";
};

const importProductRow = async ({ actor, rowData, lookups }: RowHandlerArgs) => {
  const sku = toText(rowData.sku);
  const product = toText(rowData.product);
  const brand = toText(rowData.brand);
  const categoryName = toText(rowData.categoryName);
  const assetTypeName = toText(rowData.assetTypeName);

  if (!sku) throw new Error("SKU is required.");
  if (!product) throw new Error("Product is required.");
  if (!brand) throw new Error("Brand is required.");
  if (!categoryName) throw new Error("Category is required.");
  if (!assetTypeName) throw new Error("Asset type is required.");

  const categoryId = lookups.categoryMap.get(normalizeLookup(categoryName));
  if (!categoryId) throw new Error(`Category "${categoryName}" not found.`);

  const assetTypeId = lookups.assetTypeMap.get(normalizeLookup(assetTypeName));
  if (!assetTypeId) throw new Error(`Asset type "${assetTypeName}" not found.`);

  const statusRaw = toText(rowData.status);
  const normalizedStatus = statusRaw
    ? statusRaw.toUpperCase().replace(/[\s-]+/g, "_")
    : "AVAILABLE";
  if (!isProductStatus(normalizedStatus)) {
    throw new Error(
      `Invalid status "${statusRaw}". Use ${Array.from(STATUS_VALUES).join(", ")}.`,
    );
  }

  const orderedDate = parseDate(rowData.orderedDate);
  if (orderedDate.error) throw new Error(orderedDate.error);

  const cost = parseNumber(rowData.cost);
  if (cost.error) throw new Error(cost.error);

  const warrantyExpire = parseDate(rowData.warrantyExpire);
  if (warrantyExpire.error) throw new Error(warrantyExpire.error);

  const warrantyCode = toOptionalText(rowData.warrantyPeriodCode);
  const warrantyPeriodId = warrantyCode
    ? lookups.warrantyMap.get(normalizeLookup(warrantyCode))
    : null;
  if (warrantyCode && !warrantyPeriodId) {
    throw new Error(`Warranty code "${warrantyCode}" not found.`);
  }

  const data = {
    sku,
    product,
    brand,
    snNumber: toOptionalText(rowData.snNumber),
    specification: toOptionalText(rowData.specification),
    categoryId,
    assetTypeId,
    status: normalizedStatus as ProductStatus,
    orderedDate: orderedDate.value,
    cost: cost.value != null ? cost.value.toString() : null,
    warrantyPeriodId,
    warrantyExpire: warrantyExpire.value,
  };

  let existing = null as { id: string } | null;
  if (data.snNumber) {
    existing = await prisma.product.findUnique({
      where: { snNumber: data.snNumber },
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

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { ...data, ...createActorUpdateFields(actor) },
    });
    return "updated";
  }

  await prisma.product.create({
    data: { ...data, ...createActorCreateFields(actor) },
  });
  return "created";
};

export async function importRow(args: RowHandlerArgs) {
  switch (args.entity) {
    case "categories":
      return importCategoryRow(args);
    case "assetTypes":
      return importAssetTypeRow(args);
    case "departments":
      return importDepartmentRow(args);
    case "warrantyPeriods":
      return importWarrantyRow(args);
    case "staff":
      return importStaffRow(args);
    case "products":
      return importProductRow(args);
    default:
      throw new Error("Unsupported import entity.");
  }
}
