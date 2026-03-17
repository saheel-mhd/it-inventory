"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddStaffModal from "~/app/components/staff/add-staff-modal";
import AssignProductModal from "~/app/components/staff/assign-product-modal";
import ResignStaffModal from "~/app/components/staff/resign-staff-modal";
import ResignStaffPickerModal from "~/app/components/staff/resign-staff-picker-modal";
import StaffDetailsModal from "~/app/components/staff/staff-details-modal";
import { ProductOption, StaffRow } from "~/app/components/staff/staff-types";
import DataPagination from "~/app/components/ui/data-pagination";
import FilterPanel from "~/app/components/ui/filter-panel";
import { IconEye, IconLogout } from "~/app/components/ui/icons";
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

type StaffClientProps = {
  staff: StaffRow[];
  totalPages: number;
  currentPage: number;
  q: string;
  departmentId: string;
  sort: string;
  pageSize: number;
  activeState: string;
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
  activeState,
  products,
  departments,
}: StaffClientProps) {
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);

  const activeStaffOptions = staff
    .filter((member) => member.isActive)
    .map((member) => ({ id: member.id, name: member.name }));

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (departmentId) params.set("departmentId", departmentId);
    if (sort) params.set("sort", sort);
    if (pageSize) params.set("pageSize", String(pageSize));
    if (activeState) params.set("activeState", activeState);
    params.set("page", String(nextPage));
    return `/users?${params.toString()}`;
  };

  const updateFilter = (next: {
    departmentId?: string;
    sort?: string;
    pageSize?: number;
    activeState?: string;
  }) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const nextDepartment = next.departmentId ?? departmentId;
    const nextSort = next.sort ?? sort;
    const nextPageSize = next.pageSize ?? pageSize;
    const nextActiveState = next.activeState ?? activeState;

    if (nextDepartment.trim()) params.set("departmentId", nextDepartment.trim());
    if (nextSort) params.set("sort", nextSort);
    if (nextPageSize) params.set("pageSize", String(nextPageSize));
    if (nextActiveState) params.set("activeState", nextActiveState);
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `/users?${query}` : "/users", { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-semibold text-gray-900">Staff</div>
      </div>

      <div className="flex items-center gap-3">
        <AddStaffModal products={products} departments={departments} />
        <LiveSearchInput defaultValue={q} placeholder="Search staff..." className="w-80" />
        <ResignStaffPickerModal staff={staff} />
        <div className="ml-auto">
          <AssignProductModal
            products={products}
            staffOptions={activeStaffOptions}
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
          name="activeState"
          value={activeState}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
          onChange={(event) => updateFilter({ activeState: event.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
                <TableHead className="text-right">Action</TableHead>
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
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={() => setSelectedStaff(member)}
                        aria-label="View staff"
                      >
                        <IconEye className="h-4 w-4" />
                      </button>
                      {member.isActive && (
                        <ResignStaffModal
                          staff={member}
                          triggerIcon={<IconLogout className="h-4 w-4" />}
                          triggerClassName="inline-flex items-center justify-center rounded-md bg-transparent px-2 py-1 text-sm text-gray-500 shadow-none transition-colors duration-200 hover:bg-red-200 hover:text-red-800"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.isActive ? (
                      <AssignProductModal
                        products={products}
                        staffOptions={activeStaffOptions}
                        presetStaffId={member.id}
                        triggerLabel=""
                        triggerIcon="+"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Inactive</span>
                    )}
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
            onChange={(nextSize) => updateFilter({ pageSize: nextSize })}
          />
          <DataPagination currentPage={currentPage} totalPages={totalPages} getHref={pageHref} />
        </div>
      </div>

      <StaffDetailsModal
        staff={selectedStaff}
        editingStaff={editingStaff}
        setEditingStaff={setEditingStaff}
        products={products}
        departments={departments}
        onClose={() => setSelectedStaff(null)}
        onRefresh={() => router.refresh()}
        onUpdateSelected={(next) => {
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
        }}
      />
    </div>
  );
}
