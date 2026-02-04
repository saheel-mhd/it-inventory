"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddStaffModal from "~/app/components/staff/add-staff-modal";
import AssignProductModal from "~/app/components/staff/assign-product-modal";
import EditStaffModal from "~/app/components/staff/edit-staff-modal";
import ReturnProductModal from "~/app/components/staff/return-product-modal";
import Button from "~/app/components/ui/button";
import DataPagination from "~/app/components/ui/data-pagination";
import FilterPanel from "~/app/components/ui/filter-panel";
import { IconReturn } from "~/app/components/ui/icons";
import LiveSearchInput from "~/app/components/ui/live-search-input";
import RowsPerPageSelect from "~/app/components/ui/rows-per-page-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/components/ui/table";

type ProductOption = {
  id: string;
  sku: string;
  product: string;
};

type StaffInventoryRow = {
  id: string;
  product: ProductOption;
  quantity: number;
  startDate: string;
  returnDate: string | null;
  returnReason?: string | null;
  returnReasonNote?: string | null;
};

type StaffRow = {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  inventoryUsingCount: number;
  inventoryUsing: StaffInventoryRow[];
};

type StaffClientProps = {
  staff: StaffRow[];
  totalPages: number;
  currentPage: number;
  q: string;
  departmentId: string;
  sort: string;
  pageSize: number;
  products: ProductOption[];
  departments: Array<{ id: string; name: string }>;
};

const toLabel = (value: string) =>
  value.includes("_")
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : value;

export default function StaffClient({
  staff,
  totalPages,
  currentPage,
  q,
  departmentId,
  sort,
  pageSize,
  products,
  departments,
}: StaffClientProps) {
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (departmentId) params.set("departmentId", departmentId);
    if (sort) params.set("sort", sort);
    if (pageSize) params.set("pageSize", String(pageSize));
    params.set("page", String(nextPage));
    return `/dashboard/users?${params.toString()}`;
  };

  const updateFilter = (next: { departmentId?: string; sort?: string }) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if ((next.departmentId ?? departmentId).trim()) {
      params.set("departmentId", (next.departmentId ?? departmentId).trim());
    }
    if (next.sort ?? sort) {
      params.set("sort", next.sort ?? sort);
    }
    if (pageSize) {
      params.set("pageSize", String(pageSize));
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/dashboard/users?${query}` : "/dashboard/users", { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-semibold text-gray-900">Staff</div>
      </div>

      <div className="flex items-center gap-3">
        <AddStaffModal products={products} departments={departments} />
        <LiveSearchInput defaultValue={q} placeholder="Search staff..." className="w-80" />
        <div className="ml-auto">
          <AssignProductModal
            products={products}
            staffOptions={staff.map((member) => ({ id: member.id, name: member.name }))}
            triggerLabel="Assign"
            triggerIcon="+"
          />
        </div>
      </div>

      <FilterPanel>
        <select
          name="departmentId"
          value={departmentId}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          onChange={(event) => updateFilter({ departmentId: event.target.value })}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <select
          name="sort"
          value={sort}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          onChange={(event) => updateFilter({ sort: event.target.value })}
        >
          <option value="updated_desc">Recently updated</option>
          <option value="updated_asc">Oldest updated</option>
        </select>
      </FilterPanel>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Inventory Using</TableHead>
                <TableHead className="text-right">View</TableHead>
                <TableHead className="text-right">Assign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-gray-900">{member.name}</TableCell>
                  <TableCell>{toLabel(member.department)}</TableCell>
                  <TableCell>{member.inventoryUsingCount}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setSelectedStaff(member)}
                      aria-label="View staff"
                    >
                      👁️
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <AssignProductModal
                      products={products}
                      staffOptions={staff.map((item) => ({ id: item.id, name: item.name }))}
                      presetStaffId={member.id}
                      triggerLabel=""
                      triggerIcon="+"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={5}>
                    No staff found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2">
          <RowsPerPageSelect
            value={pageSize}
            onChange={(nextSize) => {
              const params = new URLSearchParams();
              if (q.trim()) params.set("q", q.trim());
              if (departmentId) params.set("departmentId", departmentId);
              if (sort) params.set("sort", sort);
              params.set("pageSize", String(nextSize));
              router.replace(`/dashboard/users?${params.toString()}`, { scroll: false });
            }}
          />
          <DataPagination currentPage={currentPage} totalPages={totalPages} getHref={pageHref} />
        </div>
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedStaff(null)}
            aria-label="Close staff details"
          />
          <div className="relative w-full max-w-3xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{selectedStaff.name}</div>
                  <div className="text-sm text-gray-500">{toLabel(selectedStaff.department)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => setEditingStaff(selectedStaff)}>
                    Edit
                  </Button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                    onClick={() => setSelectedStaff(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">Name</div>
                  <div className="text-sm text-gray-900">{selectedStaff.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">Department</div>
                  <div className="text-sm text-gray-900">{toLabel(selectedStaff.department)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">Inventory Using</div>
                  <div className="text-sm text-gray-900">{selectedStaff.inventoryUsingCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">Updated</div>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedStaff.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <div className="mb-3 text-sm font-semibold text-gray-700">Assigned Inventory</div>
                <div className="space-y-2">
                  {selectedStaff.inventoryUsing.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-5"
                    >
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">SKU</div>
                        <div className="text-sm text-gray-900">{assignment.product.sku}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">Product</div>
                        <div className="text-sm text-gray-900">{assignment.product.product}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">Quantity</div>
                        <div className="text-sm text-gray-900">{assignment.quantity}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">Assigned At</div>
                        <div className="text-sm text-gray-900">
                          {new Date(assignment.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-end justify-end">
                        {assignment.returnDate ? (
                          <div className="text-xs text-gray-500">Returned</div>
                        ) : (
                          <ReturnProductModal
                            assignmentId={assignment.id}
                            productName={assignment.product.product}
                            sku={assignment.product.sku}
                            staffName={selectedStaff.name}
                            triggerLabel=""
                            triggerIcon={<IconReturn className="h-4 w-4" />}
                            triggerClassName="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                            onSaved={() => setSelectedStaff(null)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedStaff.inventoryUsing.length === 0 && (
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
          setSelectedStaff((prev) =>
            prev
              ? {
                  ...prev,
                  name: next.name,
                  department: next.department,
                  departmentId: next.departmentId,
                }
              : prev,
          );
          setEditingStaff(null);
          router.refresh();
        }}
      />
    </div>
  );
}
