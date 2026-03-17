import Link from "next/link";
import ReportField from "~/app/components/reports/report-field";
import { formatDate, formatReturnReason } from "~/app/components/reports/report-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type StaffAssignment = {
  id: string;
  startDate: Date;
  returnDate: Date | null;
  returnReason: string | null;
  returnReasonNote: string | null;
  product: {
    sku: string;
    product: string;
    specification: string | null;
  };
};

type SelectedStaff = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  department: { name: string };
  inventoryUsing: StaffAssignment[];
};

type SelectedStaffReportProps = {
  selectedStaff: SelectedStaff;
};

export default function SelectedStaffReport({
  selectedStaff,
}: SelectedStaffReportProps) {
  const activeAssignments = selectedStaff.inventoryUsing.filter(
    (assignment) => assignment.returnDate == null,
  );
  const returnedAssignments = selectedStaff.inventoryUsing.filter(
    (assignment) => assignment.returnDate != null,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-base font-semibold text-gray-900">{selectedStaff.name}</div>
        <div className="mt-1 text-sm text-gray-600">
          Department: <span className="font-medium">{selectedStaff.department.name}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active", value: activeAssignments.length },
          { label: "Returned", value: returnedAssignments.length },
          { label: "Total", value: selectedStaff.inventoryUsing.length },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase text-gray-400">
              {item.label}
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportField label="Created" value={formatDate(selectedStaff.createdAt)} />
        <ReportField label="Updated" value={formatDate(selectedStaff.updatedAt)} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700">Currently Using</div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium text-gray-900">
                    {assignment.product.sku}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <div className="truncate text-gray-900">{assignment.product.product}</div>
                    <div className="truncate text-xs text-gray-500">
                      {assignment.product.specification ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(assignment.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/handovers/${assignment.id}`}
                      target="_blank"
                      className="text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      Print
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {activeAssignments.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={4}>
                    No active assignments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700">Returned History</div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Form</TableHead>
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
                  <TableCell>
                    {formatReturnReason(
                      assignment.returnReason,
                      assignment.returnReasonNote,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/handovers/${assignment.id}`}
                      target="_blank"
                      className="text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      Print
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {returnedAssignments.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={6}>
                    No returned assignments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
