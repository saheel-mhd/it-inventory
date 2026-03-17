import Link from "next/link";
import { IconBox, IconChevronRight, IconUsers } from "~/app/components/ui/icons";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-gray-900">Reports</div>
        <div className="mt-1 text-sm text-gray-600">
          Generate usage and service history reports.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/reports/products"
          className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <IconBox className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-gray-900">
                  Product Report
                </div>
                <IconChevronRight className="h-5 w-5 text-gray-400 transition group-hover:text-gray-600" />
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Search a product by name or SKU and view full assignment + service history.
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/reports/staff"
          className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <IconUsers className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-gray-900">
                  Staff Report
                </div>
                <IconChevronRight className="h-5 w-5 text-gray-400 transition group-hover:text-gray-600" />
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Select a staff member and view inventory usage, returns, and reasons.
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

