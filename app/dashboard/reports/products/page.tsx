import Link from "next/link";
import { prisma } from "~/lib/prisma";
import { IconEye } from "~/app/components/ui/icons";
import LiveSearchInput from "~/app/components/ui/live-search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type ProductReportSearchParams = {
  q?: string | string[];
  productId?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const formatDate = (value: Date | null | undefined) =>
  value ? value.toLocaleDateString() : "-";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  DAMAGED: "bg-red-500",
  ACTIVE_USE: "bg-blue-500",
  UNDER_SERVICE: "bg-orange-500",
  SERVICEABLE: "bg-yellow-500",
};

const toLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatReturnReason = (
  reason: string | null | undefined,
  note: string | null | undefined,
) => {
  if (!reason) return "-";
  const base = reason === "OTHER" ? "Other" : toLabel(reason);
  return note ? `${base} - ${note}` : base;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default async function ProductReportPage({
  searchParams,
}: {
  searchParams?: Promise<ProductReportSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getParam(resolvedSearchParams?.q);
  const productId = getParam(resolvedSearchParams?.productId);

  const where = q
    ? {
        OR: [
          { product: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: {
      id: true,
      sku: true,
      product: true,
      brand: true,
      status: true,
      assignedTo: true,
      updatedAt: true,
    },
  });

  const selectedProduct = productId
    ? await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          assetType: true,
          warrantyPeriod: true,
          staffAssignments: {
            orderBy: { startDate: "desc" },
            include: { staff: { include: { department: true } } },
          },
          services: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  const productHref = (id: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("productId", id);
    return `/dashboard/reports/products?${params.toString()}`;
  };

  const clearHref = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    return params.size
      ? `/dashboard/reports/products?${params.toString()}`
      : "/dashboard/reports/products";
  };

  const activeAssignment = selectedProduct?.staffAssignments.find(
    (assignment) => assignment.returnDate == null,
  );
  const assignedName =
    selectedProduct?.assignedTo ?? activeAssignment?.staff?.name ?? null;
  const computedStatus =
    selectedProduct && assignedName && selectedProduct.status === "AVAILABLE"
      ? "ACTIVE_USE"
      : selectedProduct?.status ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Product Report</div>
          <div className="mt-1 text-sm text-gray-600">
            Search a product by name or SKU, then open it to view full history.
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
        <div className="flex flex-wrap items-center gap-2">
          <LiveSearchInput
            defaultValue={q}
            placeholder="Search by product name or SKU..."
            className="w-80"
            clearParamsOnChange={["productId"]}
          />
          {productId && (
            <Link
              href={clearHref()}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Clear
            </Link>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {q ? "Select a product from the results below." : "Start typing to search."}
        </div>
      </div>

      {q && !productId && (
        <div className="rounded-2xl border bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Select</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-gray-900">{row.sku}</TableCell>
                  <TableCell className="min-w-0">
                    <div className="truncate text-gray-900">{row.product}</div>
                    <div className="truncate text-xs text-gray-500">{row.brand}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={productHref(row.id)}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Open product report"
                    >
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={3}>
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {!selectedProduct ? (
          <div className="text-sm text-gray-600">
            Select a product from the search results to view its full history.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {selectedProduct.product}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  SKU: <span className="font-medium">{selectedProduct.sku}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Brand" value={selectedProduct.brand} />
              <Field label="Serial Number" value={selectedProduct.snNumber ?? "-"} />
              <Field label="Specification" value={selectedProduct.specification ?? "-"} />
              <Field label="Category" value={selectedProduct.category?.name ?? "-"} />
              <Field label="Asset Type" value={selectedProduct.assetType?.name ?? "-"} />
              <Field label="Ordered Date" value={formatDate(selectedProduct.orderedDate)} />
              <Field label="Cost" value={selectedProduct.cost?.toString() ?? "-"} />
              <Field
                label="Warranty"
                value={selectedProduct.warrantyPeriod?.name ?? "-"}
              />
              <Field
                label="Warranty Expire"
                value={formatDate(selectedProduct.warrantyExpire)}
              />
              <Field label="Assigned To" value={assignedName ?? "-"} />
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-gray-400">
                  Status
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      computedStatus ? STATUS_COLORS[computedStatus] : "bg-gray-400"
                    }`}
                  />
                  <span>{computedStatus ?? "-"}</span>
                </div>
              </div>
              <Field label="Updated" value={formatDate(selectedProduct.updatedAt)} />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">
                Assignment History
              </div>
              <div className="overflow-hidden rounded-xl border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Return Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProduct.staffAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium text-gray-900">
                          {assignment.staff.name}
                        </TableCell>
                        <TableCell>{assignment.staff.department.name}</TableCell>
                        <TableCell>{formatDate(assignment.startDate)}</TableCell>
                        <TableCell>
                          {assignment.returnDate
                            ? formatDate(assignment.returnDate)
                            : "Present"}
                        </TableCell>
                        <TableCell>
                          {formatReturnReason(
                            assignment.returnReason,
                            assignment.returnReasonNote,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedProduct.staffAssignments.length === 0 && (
                      <TableRow>
                        <TableCell
                          className="py-8 text-center text-gray-500"
                          colSpan={5}
                        >
                          No assignment history.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">Service History</div>

              {selectedProduct.services.length === 0 ? (
                <div className="text-sm text-gray-600">No service records.</div>
              ) : (
                <div className="space-y-3">
                  {selectedProduct.services.map((service) => {
                    const serviceState = service.sentToService
                      ? service.serviced === null
                        ? "In Service"
                        : service.serviced
                          ? "Serviced"
                          : "Service Failed"
                      : service.repairable
                        ? "Serviceable (Not Sent)"
                        : "Damaged (Not Repairable)";

                    return (
                      <div
                        key={service.id}
                        className="rounded-2xl border bg-gray-50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Reported" value={formatDate(service.createdAt)} />
                          <Field label="State" value={serviceState} />
                          <Field
                            label="Repairable"
                            value={service.repairable ? "Yes" : "No"}
                          />
                          <Field
                            label="Sent To Service"
                            value={service.sentToService ? "Yes" : "No"}
                          />
                          <Field label="Vendor" value={service.vendorName ?? "-"} />
                          <Field
                            label="Expected Return"
                            value={formatDate(service.expectedReturnDate)}
                          />
                          <Field
                            label="Service Date"
                            value={formatDate(service.serviceDate)}
                          />
                          <Field
                            label="Repair Cost"
                            value={service.serviceCost?.toString() ?? "-"}
                          />
                          <Field
                            label="Service Message"
                            value={service.serviceMessage ?? "-"}
                          />
                          <Field
                            label="Failure Reason"
                            value={service.serviceFailureReason ?? "-"}
                          />
                          <Field label="Notes" value={service.notes ?? "-"} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
