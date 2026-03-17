import Link from "next/link";
import { IconImportExport, IconSettings, IconUsers } from "~/app/components/ui/icons";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Select an area to configure.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <Link
          href="/settings/configure"
          className="group inline-flex w-24 flex-col items-center text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border surface-card text-gray-900 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <IconSettings className="h-6 w-6" />
          </div>
          <div className="mt-1 text-xs font-medium text-gray-900">Configure</div>
        </Link>

        <Link
          href="/settings/users"
          className="group inline-flex w-24 flex-col items-center text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border surface-card text-gray-900 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <IconUsers className="h-6 w-6" />
          </div>
          <div className="mt-1 text-xs font-medium text-gray-900">Users</div>
        </Link>

        <Link
          href="/settings/import-export"
          className="group inline-flex w-24 flex-col items-center text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border surface-card text-gray-900 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <IconImportExport className="h-6 w-6" />
          </div>
          <div className="mt-1 text-xs font-medium text-gray-900">Import/Export</div>
        </Link>
      </div>
    </div>
  );
}
