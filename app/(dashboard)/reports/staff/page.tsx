import Link from "next/link";
import SelectedStaffReport from "~/app/components/reports/selected-staff-report";
import {
  getSearchParam,
} from "~/app/components/reports/report-utils";
import LiveSearchInput from "~/app/components/ui/live-search-input";
import { IconEye } from "~/app/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";
import { prisma } from "~/lib/prisma";

type StaffReportSearchParams = {
  q?: string | string[];
  staffId?: string | string[];
};

export default async function StaffReportPage({
  searchParams,
}: {
  searchParams?: Promise<StaffReportSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getSearchParam(resolvedSearchParams?.q);
  const staffId = getSearchParam(resolvedSearchParams?.staffId);

  const staff = await prisma.staff.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            {
              department: {
                OR: [
                  { name: { contains: q, mode: "insensitive" as const } },
                  { code: { contains: q, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 25,
    include: {
      department: { select: { code: true, name: true } },
      _count: { select: { inventoryUsing: true } },
    },
  });

  const selectedStaff = staffId
    ? await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          department: { select: { code: true, name: true } },
          inventoryUsing: {
            orderBy: { startDate: "desc" },
            include: {
              product: {
                select: {
                  sku: true,
                  product: true,
                  specification: true,
                },
              },
            },
          },
        },
      })
    : null;

  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  const clearHref = params.size ? `/reports/staff?${params.toString()}` : "/reports/staff";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Staff Report</div>
          <div className="mt-1 text-sm text-gray-600">
            Search and select a staff member to view full inventory usage.
          </div>
        </div>
        <Link href="/reports" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Back to Reports
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <LiveSearchInput
            defaultValue={q}
            placeholder="Search staff by name (or department)..."
            className="w-80"
            clearParamsOnChange={["staffId"]}
          />
          {staffId && (
            <Link href={clearHref} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Clear
            </Link>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {q ? "Select a staff member from the results below." : "Start typing to search."}
        </div>
      </div>

      {q && !staffId && (
        <div className="rounded-2xl border bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Select</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-gray-900">{member.name}</TableCell>
                  <TableCell className="text-gray-700">
                    {member.department.name}
                    <div className="text-xs text-gray-500">
                      Total assignments: {member._count.inventoryUsing}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/reports/staff?q=${encodeURIComponent(q)}&staffId=${member.id}`}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Open staff report"
                    >
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={3}>
                    No staff found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {selectedStaff ? (
          <SelectedStaffReport selectedStaff={selectedStaff} />
        ) : (
          <div className="text-sm text-gray-600">
            Select a staff member from the search results to view their report.
          </div>
        )}
      </div>
    </div>
  );
}
