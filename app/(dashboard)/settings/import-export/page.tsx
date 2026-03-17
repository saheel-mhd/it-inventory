import ImportExportClient from "~/app/components/settings/import-export-client";

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import / Export</h1>
        <p className="mt-1 text-sm text-gray-600">
          Download templates, export data, and import updates in CSV or Excel.
        </p>
      </div>

      <ImportExportClient />
    </div>
  );
}
