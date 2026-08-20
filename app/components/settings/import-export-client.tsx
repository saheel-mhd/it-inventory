"use client";

import { useState } from "react";
import Button from "~/app/components/ui/button";
import { INVENTORY_COLUMNS, INVENTORY_REQUIRED_COLUMNS } from "~/lib/import-export";
import { apiFetch } from "~/lib/api-fetch";

type ImportError = { row: number; message: string };
type ImportDetails = {
  departments: number;
  assetTypes: number;
  categories: number;
  warranties: number;
  users: number;
  products: number;
  assignments: number;
  returns: number;
};
type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  details?: ImportDetails;
};

const REQUIRED = new Set<string>(INVENTORY_REQUIRED_COLUMNS);

const CREATED_LABELS: { key: keyof ImportDetails; label: string }[] = [
  { key: "products", label: "Assets" },
  { key: "users", label: "Users" },
  { key: "departments", label: "Departments" },
  { key: "categories", label: "Categories" },
  { key: "assetTypes", label: "Asset types" },
  { key: "warranties", label: "Warranties" },
];

export default function ImportExportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onImport = async () => {
    if (!file) {
      setError("Choose a CSV or XLSX file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiFetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Import failed.");
        return;
      }
      setResult({
        created: payload.created ?? 0,
        updated: payload.updated ?? 0,
        skipped: payload.skipped ?? 0,
        errors: payload.errors ?? [],
        details: payload.details,
      });
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Import inventory</h2>
        <p className="mt-1 text-sm text-gray-600">
          One sheet holds everything. Each row is a single asset along with the
          department, category, asset type, warranty and person it belongs to.
          Anything named here that does not exist yet is created; anything that
          already exists is reused, so a department repeated on 90 rows stays one
          record.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Assets are matched on serial number, then on SKU. Re-importing an
          edited sheet updates matching assets instead of duplicating them.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            href="/api/export?entity=inventory&format=xlsx&template=1"
          >
            Download blank template
          </a>
          <a
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            href="/api/export?entity=inventory&format=xlsx"
          >
            Export current inventory
          </a>
          <a
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            href="/api/export?entity=inventory&format=csv"
          >
            Export as CSV
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
              setResult(null);
            }}
            className="block text-xs text-gray-600"
          />
          <Button type="button" onClick={onImport} disabled={isUploading}>
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-900">
              {result.created} assets added, {result.updated} updated
              {result.skipped > 0 ? `, ${result.skipped} blank rows skipped` : ""}
              {result.errors.length > 0
                ? `, ${result.errors.length} rows failed`
                : ""}
            </div>

            {result.details && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                {CREATED_LABELS.filter(
                  ({ key }) => (result.details?.[key] ?? 0) > 0,
                ).map(({ key, label }) => (
                  <span key={key}>
                    {label} created: {result.details?.[key]}
                  </span>
                ))}
                {result.details.assignments > 0 && (
                  <span>Assigned to a user: {result.details.assignments}</span>
                )}
                {result.details.returns > 0 && (
                  <span>Previous holdings closed: {result.details.returns}</span>
                )}
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded border border-red-200 bg-white p-2 text-xs text-red-700">
                {result.errors.map((err) => (
                  <div key={`${err.row}-${err.message}`}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Sheet columns</h2>
        <p className="mt-1 text-sm text-gray-600">
          Column headings ignore case and punctuation, so{" "}
          <span className="ident">product_sku</span> and{" "}
          <span className="ident">Product SKU</span> both work. Required columns
          are marked; leave anything else blank when you do not know it.
        </p>
        <ul className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {INVENTORY_COLUMNS.map((column) => (
            <li key={column} className="flex items-center gap-2">
              <span className="ident text-gray-800">{column}</span>
              {REQUIRED.has(column) && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  required
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
