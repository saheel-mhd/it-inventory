import * as XLSX from "xlsx";
import { prisma } from "~/lib/prisma";
import { DATASET_DEFINITIONS, type DatasetKey } from "~/lib/import-export";
import type { CurrentAdmin } from "~/server/auth/session";
import { importRow } from "~/server/services/import-row-handlers";
import {
  ImportError,
  ImportLookups,
  isRowEmpty,
  normalizeHeader,
  normalizeLookup,
  parseEntity,
  toText,
} from "~/server/services/import-utils";

export async function processImportRequest(request: Request, actor: CurrentAdmin) {
  const url = new URL(request.url);
  const entity = parseEntity(url.searchParams.get("entity"));
  if (!entity) return { error: "Invalid import entity." };

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "File is required." };

  const filename = file.name?.toLowerCase() ?? "";
  const format = filename.endsWith(".xlsx")
    ? "xlsx"
    : filename.endsWith(".csv")
      ? "csv"
      : null;
  if (!format) return { error: "Unsupported file format. Use CSV or XLSX." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook =
    format === "csv"
      ? XLSX.read(buffer.toString("utf8"), { type: "string" })
      : XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { error: "No sheet found." };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as
    | unknown[][]
    | [];
  if (rows.length === 0) return { error: "File is empty." };

  const definition = DATASET_DEFINITIONS[entity];
  const columnIndexes = getColumnIndexes(rows[0] as unknown[], definition.columns);
  const missingHeaders = definition.requiredColumns.filter(
    (column) => columnIndexes[column] === -1,
  );
  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(", ")}` };
  }

  const lookups = await loadImportLookups(entity);
  const summary = { created: 0, updated: 0, skipped: 0, errors: [] as ImportError[] };

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] as unknown[];
    if (isRowEmpty(row)) {
      summary.skipped += 1;
      continue;
    }

    const rowNumber = index + 1;
    const rowData = mapRowData(definition.columns, columnIndexes, row);

    try {
      const result = await importRow({ actor, entity, rowData, lookups });
      if (result === "created") summary.created += 1;
      if (result === "updated") summary.updated += 1;
    } catch (error) {
      summary.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Invalid row.",
      });
    }
  }

  return summary;
}

function getColumnIndexes(headers: unknown[], columns: string[]) {
  const normalizedHeaders = headers.map((value) => normalizeHeader(toText(value)));
  const indexes: Record<string, number> = {};

  for (const column of columns) {
    indexes[column] = normalizedHeaders.indexOf(normalizeHeader(column));
  }

  return indexes;
}

function mapRowData(
  columns: string[],
  columnIndexes: Record<string, number>,
  row: unknown[],
) {
  const rowData: Record<string, unknown> = {};

  for (const column of columns) {
    const index = columnIndexes[column];
    rowData[column] = index >= 0 ? row[index] : "";
  }

  return rowData;
}

async function loadImportLookups(entity: DatasetKey): Promise<ImportLookups> {
  const lookups: ImportLookups = {
    assetTypeMap: new Map<string, string>(),
    categoryMap: new Map<string, string>(),
    departmentMap: new Map<string, string>(),
    warrantyMap: new Map<string, string>(),
  };

  if (entity === "products" || entity === "categories") {
    const assetTypes = await prisma.assetType.findMany({
      select: { id: true, name: true },
    });
    for (const assetType of assetTypes) {
      lookups.assetTypeMap.set(normalizeLookup(assetType.name), assetType.id);
    }
  }

  if (entity === "products") {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    for (const category of categories) {
      lookups.categoryMap.set(normalizeLookup(category.name), category.id);
    }

    const warrantyPeriods = await prisma.warrantyPeriodModel.findMany({
      select: { id: true, code: true },
    });
    for (const period of warrantyPeriods) {
      lookups.warrantyMap.set(normalizeLookup(period.code), period.id);
    }
  }

  if (entity === "staff") {
    const departments = await prisma.departmentModel.findMany({
      select: { id: true, code: true },
    });
    for (const department of departments) {
      lookups.departmentMap.set(normalizeLookup(department.code), department.id);
    }
  }

  return lookups;
}
