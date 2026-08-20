import * as XLSX from "xlsx";
import { prisma } from "~/lib/prisma";
import { DATASET_DEFINITIONS, INVENTORY_COLUMNS, type DatasetKey, } from "~/lib/import-export";
import { parseEntity } from "~/server/services/import-utils";

const formatDate = (value: Date | null | undefined) =>
  value ? value.toISOString().slice(0, 10) : "";

const formatBoolean = (value: boolean | null | undefined) =>
  value == null ? "" : value ? "TRUE" : "FALSE";

const getFilename = (entity: string, format: string) =>
  `${entity}-${new Date().toISOString().slice(0, 10)}.${format}`;

export async function buildExportFile(request: Request) {
  const url = new URL(request.url);
  const entity = parseEntity(url.searchParams.get("entity"));
  const format = url.searchParams.get("format")?.toLowerCase();
  const template = url.searchParams.get("template") === "1";

  const isInventory = url.searchParams.get("entity") === "inventory";

  if (!isInventory && !entity) return { error: "Invalid export entity." };
  if (format !== "csv" && format !== "xlsx") {
    return { error: "Invalid export format." };
  }

  const columns = isInventory
    ? [...INVENTORY_COLUMNS]
    : DATASET_DEFINITIONS[entity!].columns;
  const rows = template
    ? []
    : isInventory
      ? await loadInventoryRows()
      : await loadRows(entity!);
  const sheet =
    rows.length === 0
      ? XLSX.utils.aoa_to_sheet([columns])
      : XLSX.utils.json_to_sheet(rows, { header: columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");

  if (format === "csv") {
    return {
      body: "\ufeff" + XLSX.utils.sheet_to_csv(sheet),
      contentType: "text/csv; charset=utf-8",
      filename: getFilename(isInventory ? "inventory" : entity!, "csv"),
    };
  }

  return {
    body: XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: getFilename(isInventory ? "inventory" : entity!, "xlsx"),
  };
}

async function loadInventoryRows() {
  const products = await prisma.product.findMany({
    orderBy: [{ sku: "asc" }],
    include: {
      category: true,
      assetType: true,
      warrantyPeriod: true,
      department: true,
      staffAssignments: {
        where: { returnDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        include: { staff: { include: { department: true } } },
      },
    },
  });

  return products.map((product) => {
    const holder = product.staffAssignments[0]?.staff ?? null;
    const department = holder?.department ?? product.department ?? null;
    return {
      department_code: department?.code ?? "",
      department_name: department?.name ?? "",
      assettype_name: product.assetType?.name ?? "",
      category_name: product.category?.name ?? "",
      category_prefix: product.category?.prefix ?? "",
      warranty_code: product.warrantyPeriod?.code ?? "",
      warranty_name: product.warrantyPeriod?.name ?? "",
      warrantyin_months: product.warrantyPeriod?.months?.toString() ?? "",
      user_name: holder?.name ?? "",
      product_sku: product.sku ?? "",
      product_name: product.product ?? "",
      product_brand: product.brand ?? "",
      product_snNumber: product.snNumber ?? "",
      product_specification: product.specification ?? "",
      product_quantity: product.quantity?.toString() ?? "1",
      product_status: product.status ?? "",
      product_orderedDate: formatDate(product.orderedDate),
      product_cost: product.cost ? product.cost.toString() : "",
      product_warrantyExpire: formatDate(product.warrantyExpire),
    };
  });
}

async function loadRows(entity: DatasetKey) {
  if (entity === "products") {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: true, assetType: true, warrantyPeriod: true },
    });
    return products.map((product) => ({
      sku: product.sku ?? "",
      product: product.product ?? "",
      brand: product.brand ?? "",
      snNumber: product.snNumber ?? "",
      specification: product.specification ?? "",
      categoryName: product.category?.name ?? "",
      assetTypeName: product.assetType?.name ?? "",
      status: product.status ?? "",
      orderedDate: formatDate(product.orderedDate),
      cost: product.cost ? product.cost.toString() : "",
      warrantyPeriodCode: product.warrantyPeriod?.code ?? "",
      warrantyExpire: formatDate(product.warrantyExpire),
    }));
  }

  if (entity === "staff") {
    const staff = await prisma.staff.findMany({
      orderBy: { updatedAt: "desc" },
      include: { department: true },
    });
    return staff.map((member) => ({
      name: member.name ?? "",
      departmentCode: member.department?.code ?? "",
      isActive: formatBoolean(member.isActive),
    }));
  }

  if (entity === "categories") {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { assetType: true },
    });
    return categories.map((category) => ({
      name: category.name ?? "",
      prefix: category.prefix ?? "",
      assetTypeName: category.assetType?.name ?? "",
      isActive: formatBoolean(category.isActive),
    }));
  }

  if (entity === "assetTypes") {
    const assetTypes = await prisma.assetType.findMany({ orderBy: { name: "asc" } });
    return assetTypes.map((assetType) => ({
      name: assetType.name ?? "",
      isActive: formatBoolean(assetType.isActive),
    }));
  }

  if (entity === "departments") {
    const departments = await prisma.departmentModel.findMany({
      orderBy: { name: "asc" },
    });
    return departments.map((department) => ({
      code: department.code ?? "",
      name: department.name ?? "",
      isActive: formatBoolean(department.isActive),
    }));
  }

  const warrantyPeriods = await prisma.warrantyPeriodModel.findMany({
    orderBy: [{ months: "asc" }, { name: "asc" }],
  });
  return warrantyPeriods.map((period) => ({
    code: period.code ?? "",
    name: period.name ?? "",
    months: period.months?.toString() ?? "",
    isActive: formatBoolean(period.isActive),
  }));
}
