import EditStaffModal from "~/app/components/staff/edit-staff-modal";
import ReturnProductModal from "~/app/components/staff/return-product-modal";
import { ProductOption, StaffRow } from "~/app/components/staff/staff-types";
import Button from "~/app/components/ui/button";
import { IconReturn } from "~/app/components/ui/icons";

type StaffDetailsModalProps = {
  staff: StaffRow | null;
  editingStaff: StaffRow | null;
  setEditingStaff: (staff: StaffRow | null) => void;
  products: ProductOption[];
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
  onRefresh: () => void;
  onUpdateSelected: (staff: {
    name: string;
    department: string;
    departmentId: string;
  }) => void;
};

const toLabel = (value: string) =>
  value.includes("_")
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : value;

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default function StaffDetailsModal({
  staff,
  editingStaff,
  setEditingStaff,
  products,
  departments,
  onClose,
  onRefresh,
  onUpdateSelected,
}: StaffDetailsModalProps) {
  return (
    <>
      {staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label="Close staff details"
          />
          <div className="relative w-full max-w-3xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{staff.name}</div>
                  <div className="text-sm text-gray-500">{toLabel(staff.department)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => setEditingStaff(staff)}>
                    Edit
                  </Button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                <Detail label="Name" value={staff.name} />
                <Detail label="Department" value={toLabel(staff.department)} />
                <Detail label="Inventory Using" value={String(staff.inventoryUsingCount)} />
                <Detail label="Updated" value={new Date(staff.updatedAt).toLocaleDateString()} />
              </div>

              <div className="border-t px-5 py-4">
                <div className="mb-3 text-sm font-semibold text-gray-700">
                  Assigned Inventory
                </div>
                <div className="space-y-2">
                  {staff.inventoryUsing.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-5"
                    >
                      <Detail label="SKU" value={assignment.product.sku} />
                      <Detail label="Product" value={assignment.product.product} />
                      <Detail label="Quantity" value={String(assignment.quantity)} />
                      <Detail
                        label="Assigned At"
                        value={new Date(assignment.startDate).toLocaleDateString()}
                      />
                      <div className="flex items-end justify-end">
                        {assignment.returnDate ? (
                          <div className="text-xs text-gray-500">Returned</div>
                        ) : (
                          <ReturnProductModal
                            assignmentId={assignment.id}
                            productName={assignment.product.product}
                            sku={assignment.product.sku}
                            staffName={staff.name}
                            triggerLabel=""
                            triggerIcon={<IconReturn className="h-4 w-4" />}
                            triggerClassName="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                            onSaved={onClose}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {staff.inventoryUsing.length === 0 && (
                    <div className="text-sm text-gray-500">No inventory assigned yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditStaffModal
        open={Boolean(editingStaff)}
        staff={
          editingStaff
            ? {
                id: editingStaff.id,
                name: editingStaff.name,
                departmentId: editingStaff.departmentId,
              }
            : null
        }
        products={products}
        departments={departments}
        onClose={() => setEditingStaff(null)}
        onSaved={(next) => {
          onUpdateSelected(next);
          setEditingStaff(null);
          onRefresh();
        }}
      />
    </>
  );
}
