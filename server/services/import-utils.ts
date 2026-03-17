import { ProductStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { DATASET_DEFINITIONS, type DatasetKey } from "~/lib/import-export";

export type ImportError = { row: number; message: string };

export type ImportLookups = {
  assetTypeMap: Map<string, string>;
  categoryMap: Map<string, string>;
  departmentMap: Map<string, string>;
  warrantyMap: Map<string, string>;
};

export const STATUS_VALUES = new Set<ProductStatus>(Object.values(ProductStatus));

export const isProductStatus = (value: string): value is ProductStatus =>
  STATUS_VALUES.has(value as ProductStatus);

export const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const normalizeLookup = (value: string) => value.trim().toLowerCase();

export const toText = (value: unknown) => String(value ?? "").trim();

export const toOptionalText = (value: unknown) => {
  const text = toText(value);
  return text ? text : null;
};

export const parseBoolean = (value: unknown) => {
  const text = toText(value).toLowerCase();
  if (!text) return { value: null as boolean | null };
  if (["true", "yes", "1"].includes(text)) return { value: true };
  if (["false", "no", "0"].includes(text)) return { value: false };
  return { error: `Invalid boolean "${value}". Use TRUE/FALSE.` };
};

export const parseNumber = (value: unknown) => {
  const text = toText(value);
  if (!text) return { value: null as number | null };

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return { error: `Invalid number "${value}".` };
  }

  return { value: parsed };
};

export const parseDate = (value: unknown) => {
  if (value == null || value === "") return { value: null as Date | null };

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { error: `Invalid date "${value}".` };
    }
    return { value };
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return { value: new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)) };
    }
  }

  const date = new Date(toText(value));
  if (Number.isNaN(date.getTime())) {
    return { error: `Invalid date "${value}". Use YYYY-MM-DD.` };
  }

  return { value: date };
};

export const parseEntity = (value: string | null): DatasetKey | null => {
  if (!value) return null;
  const key = value as DatasetKey;
  return key in DATASET_DEFINITIONS ? key : null;
};

export const isRowEmpty = (row: unknown[]) =>
  row.every((cell) => toText(cell) === "");
