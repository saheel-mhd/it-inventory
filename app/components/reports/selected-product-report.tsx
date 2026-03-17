import ReportField from "~/app/components/reports/report-field";
import {
  formatDate,
  formatReturnReason,
  STATUS_COLORS,
} from "~/app/components/reports/report-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type SelectedProduct = {
  product: string;
  sku: string;
  brand: string;
  snNumber: string | null;
  specification: string | null;
  orderedDate: Date | null;
  cost: { toString(): string } | null;
  warrantyExpire: Date | null;
  updatedAt: Date;
  assignedTo: string | null;
  status: string;
  category: { name: string } | null;
  assetType: { name: string } | null;
  warrantyPeriod: { name: string } | null;
  staffAssignments: Array<{
    id: string;
    startDate: Date;
    returnDate: Date | null;
    returnReason: string | null;
    returnReasonNote: string | null;
    staff: { name: string; department: { name: string } };
  }>;
  services: Array<{
    id: string;
    createdAt: Date;
    repairable: boolean;
    sentToService: boolean;
    serviced: boolean | null;
    vendorName: string | null;
    expectedReturnDate: Date | null;
    serviceDate: Date | null;
    serviceCost: { toString(): string } | null;
    serviceMessage: string | null;
    serviceFailureReason: string | null;
    notes: string | null;
  }>;
};

type SelectedProductReportProps = {
  selectedProduct: SelectedProduct;
};

export default function SelectedProductReport({
  selectedProduct,
}: SelectedProductReportProps) {
  const activeAssignment = selectedProduct.staffAssignments.find(
    (assignment) => assignment.returnDate == null,
  );
  const assignedName = selectedProduct.assignedTo ?? activeAssignment?.staff?.name ?? null;
  const computedStatus =
    assignedName && selectedProduct.status === "AVAILABLE"
      ? "ACTIVE_USE"
      : selectedProduct.status;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-base font-semibold text-gray-900">
          {selectedProduct.product}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          SKU: <span className="font-medium">{selectedProduct.sku}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportField label="Brand" value={selectedProduct.brand} />
        <ReportField label="Serial Number" value={selectedProduct.snNumber ?? "-"} />
        <ReportField label="Specification" value={selectedProduct.specification ?? "-"} />
        <ReportField label="Category" value={selectedProduct.category?.name ?? "-"} />
        <ReportField label="Asset Type" value={selectedProduct.assetType?.name ?? "-"} />
        <ReportField label="Ordered Date" value={formatDate(selectedProduct.orderedDate)} />
        <ReportField label="Cost" value={selectedProduct.cost?.toString() ?? "-"} />
        <ReportField
          label="Warranty"
          value={selectedProduct.warrantyPeriod?.name ?? "-"}
        />
        <ReportField
          label="Warranty Expire"
          value={formatDate(selectedProduct.warrantyExpire)}
        />
        <ReportField label="Assigned To" value={assignedName ?? "-"} />
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase text-gray-400">Status</div>
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                STATUS_COLORS[computedStatus] ?? "bg-gray-400"
              }`}
            />
            <span>{computedStatus}</span>
          </div>
        </div>
        <ReportField label="Updated" value={formatDate(selectedProduct.updatedAt)} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700">Assignment History</div>
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
                    {assignment.returnDate ? formatDate(assignment.returnDate) : "Present"}
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
                  <TableCell className="py-8 text-center text-gray-500" colSpan={5}>
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
                <div key={service.id} className="rounded-2xl border bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReportField label="Reported" value={formatDate(service.createdAt)} />
                    <ReportField label="State" value={serviceState} />
                    <ReportField
                      label="Repairable"
                      value={service.repairable ? "Yes" : "No"}
                    />
                    <ReportField
                      label="Sent To Service"
                      value={service.sentToService ? "Yes" : "No"}
                    />
                    <ReportField label="Vendor" value={service.vendorName ?? "-"} />
                    <ReportField
                      label="Expected Return"
                      value={formatDate(service.expectedReturnDate)}
                    />
                    <ReportField
                      label="Service Date"
                      value={formatDate(service.serviceDate)}
                    />
                    <ReportField
                      label="Repair Cost"
                      value={service.serviceCost?.toString() ?? "-"}
                    />
                    <ReportField
                      label="Service Message"
                      value={service.serviceMessage ?? "-"}
                    />
                    <ReportField
                      label="Failure Reason"
                      value={service.serviceFailureReason ?? "-"}
                    />
                    <ReportField label="Notes" value={service.notes ?? "-"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
