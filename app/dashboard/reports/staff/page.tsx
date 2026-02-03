import Link from "next/link";
import { Department } from "@prisma/client";
import { prisma } from "~/lib/prisma";
import { IconEye } from "~/app/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type StaffReportSearchParams = {
  q?: string | string[];
  staffId?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const formatDate = (value: Date | null | undefined) =>
  value ? value.toLocaleDateString() : "-";

const toLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default async function StaffReportPage({
  searchParams,
}: {
  searchParams?: Promise<StaffReportSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getParam(resolvedSearchParams?.q);
  const staffId = getParam(resolvedSearchParams?.staffId);

  const normalizedQ = q.trim().toUpperCase().replace(/\s+/g, "_");
  const departmentMatch = Object.values(Department).includes(
    normalizedQ as Department,
  )
    ? (normalizedQ as Department)
    : null;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          ...(departmentMatch ? [{ department: departmentMatch }] : []),
        ],
      }
    : undefined;

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 25,
    include: { _count: { select: { inventoryUsing: true } } },
  });

  const selectedStaff = staffId
    ? await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          inventoryUsing: {
            orderBy: { startDate: "desc" },
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  product: true,
                  specification: true,
                  status: true,
                },
              },
            },
          },
        },
      })
    : null;

  const staffHref = (id: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("staffId", id);
    return `/dashboard/reports/staff?${params.toString()}`;
  };

  const clearHref = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    return params.size
      ? `/dashboard/reports/staff?${params.toString()}`
      : "/dashboard/reports/staff";
  };

  const activeAssignments =
    selectedStaff?.inventoryUsing.filter((row) => row.returnDate == null) ?? [];
  const returnedAssignments =
    selectedStaff?.inventoryUsing.filter((row) => row.returnDate != null) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Staff Report</div>
          <div className="mt-1 text-sm text-gray-600">
            Search and select a staff member to view full inventory usage.
          </div>
        </div>
        <Link
          href="/dashboard/reports"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to Reports
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <form
          action="/dashboard/reports/staff"
          method="get"
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search staff by name (or department)..."
            className="h-10 w-full min-w-[240px] flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {staffId && (
            <Link
              href={clearHref()}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Clear
            </Link>
          )}
        </form>
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
                  <TableCell className="font-medium text-gray-900">
                    {member.name}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {toLabel(member.department)}
                    <div className="text-xs text-gray-500">
                      Total assignments: {member._count.inventoryUsing}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={staffHref(member.id)}
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
        {!selectedStaff ? (
          <div className="text-sm text-gray-600">
            Select a staff member from the search results to view their report.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {selectedStaff.name}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Department:{" "}
                  <span className="font-medium">
                    {toLabel(selectedStaff.department)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Active
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {activeAssignments.length}
                </div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Returned
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {returnedAssignments.length}
                </div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Total
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedStaff.inventoryUsing.length}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Created" value={formatDate(selectedStaff.createdAt)} />
              <Field label="Updated" value={formatDate(selectedStaff.updatedAt)} />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">
                Currently Using
              </div>
              <div className="overflow-hidden rounded-xl border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium text-gray-900">
                          {assignment.product.sku}
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div className="truncate text-gray-900">
                            {assignment.product.product}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            {assignment.product.specification ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(assignment.startDate)}</TableCell>
                      </TableRow>
                    ))}
                    {activeAssignments.length === 0 && (
                      <TableRow>
                        <TableCell
                          className="py-8 text-center text-gray-500"
                          colSpan={3}
                        >
                          No active assignments.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">
                Returned History
              </div>
              <div className="overflow-hidden rounded-xl border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnedAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium text-gray-900">
                          {assignment.product.sku}
                        </TableCell>
                        <TableCell>{assignment.product.product}</TableCell>
                        <TableCell>{formatDate(assignment.startDate)}</TableCell>
                        <TableCell>{formatDate(assignment.returnDate)}</TableCell>
                        <TableCell>{assignment.returnReason ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    {returnedAssignments.length === 0 && (
                      <TableRow>
                        <TableCell
                          className="py-8 text-center text-gray-500"
                          colSpan={5}
                        >
                          No returned assignments.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
