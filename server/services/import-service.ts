import * as XLSX from "xlsx";
import { INVENTORY_COLUMNS, INVENTORY_REQUIRED_COLUMNS, } from "~/lib/import-export";
import type { CurrentAdmin } from "~/server/auth/session";
import { emptyCaches, emptyCounts, importInventoryRow, type RowContext, } from "~/server/services/inventory-import";
import { ImportError, isRowEmpty, normalizeHeader, toText, } from "~/server/services/import-utils";

export async function processImportRequest(request: Request, actor: CurrentAdmin) {
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
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  if (rows.length === 0) return { error: "File is empty." };

  const columns = [...INVENTORY_COLUMNS];
  const columnIndexes = getColumnIndexes(rows[0] ?? [], columns);
  const missingHeaders = INVENTORY_REQUIRED_COLUMNS.filter(
    (column) => columnIndexes[column] === -1,
  );
  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(", ")}` };
  }

  const ctx: RowContext = {
    actor,
    caches: emptyCaches(),
    counts: emptyCounts(),
  };
  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as ImportError[],
  };

  const seenSku = new Map<string, number>();

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (isRowEmpty(row)) {
      summary.skipped += 1;
      continue;
    }

    const rowNumber = index + 1;
    const rowData = mapRowData(columns, columnIndexes, row);

    const sku = toText(rowData.product_sku).toUpperCase();
    if (sku) {
      const firstSeen = seenSku.get(sku);
      if (firstSeen) {
        summary.errors.push({
          row: rowNumber,
          message: `product_sku "${sku}" already appears on row ${firstSeen}. Give each asset its own tag, or remove the duplicate row.`,
        });
        continue;
      }
      seenSku.set(sku, rowNumber);
    }

    try {
      const result = await importInventoryRow(rowData, ctx);
      if (result === "created") summary.created += 1;
      if (result === "updated") summary.updated += 1;
    } catch (error) {
      summary.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Invalid row.",
      });
    }
  }

  return { ...summary, details: ctx.counts };
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
