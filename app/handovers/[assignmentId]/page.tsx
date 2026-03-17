import Link from "next/link";
import { notFound } from "next/navigation";
import UnauthorizedView from "~/app/components/auth/unauthorized-view";
import PrintButton from "~/app/components/ui/print-button";
import { prisma } from "~/lib/prisma";
import { getActiveSessionStatusUser } from "~/server/auth/session";

const formatDateTime = (value: Date | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(value);
};

const formatDate = (value: Date | null) =>
  value ? value.toLocaleDateString() : "-";

const toLabel = (value: string | null) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";

export default async function HandoverFormPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await getActiveSessionStatusUser();

  if (!user) return <UnauthorizedView />;

  const { assignmentId } = await params;
  const assignment = await prisma.staffInventory.findUnique({
    where: { id: assignmentId },
    include: {
      staff: { include: { department: true } },
      product: {
        include: { category: true, assetType: true, warrantyPeriod: true },
      },
    },
  });

  if (!assignment) notFound();

  const isReturned = Boolean(assignment.returnDate);
  const formTitle = isReturned ? "Return Form" : "Handover Form";

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
        }
        @media print {
          .print-sheet {
            width: 210mm;
            min-height: 297mm;
          }
        }
        @media print {
          .two-col-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .asset-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/reports" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Back to Reports
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">
              IT Inventory System
            </div>
            <div className="text-2xl font-semibold text-gray-900">{formTitle}</div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Generated: {formatDateTime(new Date())}</div>
          </div>
        </div>

        <div className="two-col-grid mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase text-gray-400">Staff</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {assignment.staff.name}
            </div>
            <div className="text-sm text-gray-600">
              Department: {assignment.staff.department.name}
            </div>
            <div className="text-sm text-gray-600">
              Department Code: {assignment.staff.department.code}
            </div>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase text-gray-400">Assignment</div>
            <div className="mt-1 text-sm text-gray-700">
              Assigned Date: {formatDate(assignment.startDate)}
            </div>
            <div className="text-sm text-gray-700">
              Quantity: {assignment.quantity}
            </div>
            <div className="text-sm text-gray-700">
              Return Date: {formatDate(assignment.returnDate)}
            </div>
            <div className="text-sm text-gray-700">
              Return Reason: {toLabel(assignment.returnReason)}
            </div>
            {assignment.returnReasonNote && (
              <div className="text-sm text-gray-700">
                Return Note: {assignment.returnReasonNote}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-white">
          <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700">
            Asset Details
          </div>
          <div className="asset-grid grid gap-4 px-4 py-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-gray-400">Product</div>
              <div className="text-gray-900">{assignment.product.product}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">SKU</div>
              <div className="text-gray-900">{assignment.product.sku}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Brand</div>
              <div className="text-gray-900">{assignment.product.brand}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Serial Number</div>
              <div className="text-gray-900">{assignment.product.snNumber ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Category</div>
              <div className="text-gray-900">{assignment.product.category?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Asset Type</div>
              <div className="text-gray-900">{assignment.product.assetType?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Warranty</div>
              <div className="text-gray-900">
                {assignment.product.warrantyPeriod?.name ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Warranty Expire</div>
              <div className="text-gray-900">
                {formatDate(assignment.product.warrantyExpire)}
              </div>
            </div>
          </div>
        </div>

        <div className="two-col-grid mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-dashed px-4 py-6">
            <div className="text-sm font-semibold text-gray-700">
              Issued By (IT / Admin)
            </div>
            <div className="mt-6 border-t pt-4 text-sm text-gray-600">
              Name & Signature
            </div>
          </div>
          <div className="rounded-xl border border-dashed px-4 py-6">
            <div className="text-sm font-semibold text-gray-700">
              Received By (Staff)
            </div>
            <div className="mt-6 border-t pt-4 text-sm text-gray-600">
              Name & Signature
            </div>
          </div>
        </div>

        {isReturned && (
          <div className="mt-6 rounded-xl border border-dashed px-4 py-6">
            <div className="text-sm font-semibold text-gray-700">
              Return Acceptance (IT / Admin)
            </div>
            <div className="mt-6 border-t pt-4 text-sm text-gray-600">
              Name & Signature
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
