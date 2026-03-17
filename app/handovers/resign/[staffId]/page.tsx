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

export default async function ResignHandoverFormPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const user = await getActiveSessionStatusUser();

  if (!user) return <UnauthorizedView />;

  const { staffId } = await params;
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      department: true,
      inventoryUsing: {
        where: { returnDate: null },
        orderBy: { startDate: "asc" },
        include: {
          product: { select: { sku: true, product: true } },
        },
      },
    },
  });

  if (!staff) notFound();

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
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/users" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Back to Staff
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">
              IT Inventory System
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              Resignation Handover Form
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Generated: {formatDateTime(new Date())}
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Staff: {staff.name}</div>
            <div>Department: {staff.department.name}</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-white">
          <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700">
            Assets To Handover
          </div>
          <div className="px-4 py-4 text-sm text-gray-700">
            {staff.inventoryUsing.length === 0 ? (
              <div className="text-sm text-gray-600">
                No active assets assigned to this staff member.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-400">
                    <th className="border-b pb-2">SKU</th>
                    <th className="border-b pb-2">Product</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.inventoryUsing.map((assignment) => (
                    <tr key={assignment.id} className="text-sm text-gray-900">
                      <td className="border-b py-2">{assignment.product.sku}</td>
                      <td className="border-b py-2">{assignment.product.product}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
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
              Returned By (Staff)
            </div>
            <div className="mt-6 border-t pt-4 text-sm text-gray-600">
              Name & Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
