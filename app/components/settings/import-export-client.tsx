"use client";

import { useMemo, useState } from "react";
import Button from "~/app/components/ui/button";
import { DATASET_DEFINITIONS, type DatasetKey } from "~/lib/import-export";

type ImportError = { row: number; message: string };
type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
};

type DatasetState = {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  result: ImportResult | null;
};

const datasetKeys: DatasetKey[] = [
  "departments",
  "assetTypes",
  "categories",
  "warrantyPeriods",
  "staff",
  "products",
];

const createDefaultState = () =>
  datasetKeys.reduce((acc, key) => {
    acc[key] = {
      file: null,
      isUploading: false,
      error: null,
      result: null,
    };
    return acc;
  }, {} as Record<DatasetKey, DatasetState>);

export default function ImportExportClient() {
  const [state, setState] = useState<Record<DatasetKey, DatasetState>>(
    createDefaultState,
  );

  const importOrder = useMemo(
    () =>
      datasetKeys.map((key) => DATASET_DEFINITIONS[key].label),
    [],
  );

  const updateState = (key: DatasetKey, updates: Partial<DatasetState>) => {
    setState((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const onSelectFile = (key: DatasetKey, file: File | null) => {
    updateState(key, { file, error: null, result: null });
  };

  const onImport = async (key: DatasetKey) => {
    const current = state[key];
    if (!current.file) {
      updateState(key, { error: "Please select a CSV or XLSX file." });
      return;
    }

    const formData = new FormData();
    formData.append("file", current.file);

    updateState(key, { isUploading: true, error: null });
    try {
      const response = await fetch(`/api/import?entity=${key}`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        updateState(key, { error: payload?.error ?? "Import failed." });
        return;
      }

      updateState(key, {
        result: {
          created: payload.created ?? 0,
          updated: payload.updated ?? 0,
          skipped: payload.skipped ?? 0,
          errors: payload.errors ?? [],
        },
      });
    } catch {
      updateState(key, { error: "Import failed. Please try again." });
    } finally {
      updateState(key, { isUploading: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600 shadow-sm">
        Import order: {importOrder.join(" → ")}. Products depend on categories,
        asset types, and warranty periods. Staff depend on departments.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {datasetKeys.map((key) => {
          const definition = DATASET_DEFINITIONS[key];
          const current = state[key];
          return (
            <div key={key} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-base font-semibold text-gray-900">
                {definition.label}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {definition.description}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Columns: {definition.columns.join(", ")}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  href={`/api/export?entity=${key}&format=csv&template=1`}
                >
                  Template CSV
                </a>
                <a
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  href={`/api/export?entity=${key}&format=xlsx&template=1`}
                >
                  Template XLSX
                </a>
                <a
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  href={`/api/export?entity=${key}&format=csv`}
                >
                  Export CSV
                </a>
                <a
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  href={`/api/export?entity=${key}&format=xlsx`}
                >
                  Export XLSX
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(event) =>
                    onSelectFile(key, event.target.files?.[0] ?? null)
                  }
                  className="block text-xs text-gray-600"
                />
                <Button
                  type="button"
                  onClick={() => onImport(key)}
                  disabled={current.isUploading}
                >
                  {current.isUploading ? "Importing..." : "Import"}
                </Button>
              </div>

              {current.error && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {current.error}
                </div>
              )}

              {current.result && (
                <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <div>
                    Created: {current.result.created} | Updated:{" "}
                    {current.result.updated} | Skipped: {current.result.skipped}
                  </div>
                  {current.result.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {current.result.errors.slice(0, 5).map((err) => (
                        <div key={`${key}-${err.row}-${err.message}`}>
                          Row {err.row}: {err.message}
                        </div>
                      ))}
                      {current.result.errors.length > 5 && (
                        <div>
                          +{current.result.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
