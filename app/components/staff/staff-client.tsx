"use client";

import { useState } from "react";
import Link from "next/link";
import AddStaffModal from "~/app/components/staff/add-staff-modal";
import AssignProductModal from "~/app/components/staff/assign-product-modal";
import Button from "~/app/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/app/components/ui/pagination";
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
};

type StaffRow = {
  id: string;
  name: string;
  department: string;
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
  products: ProductOption[];
  departments: string[];
};

const toLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function StaffClient({
  staff,
  totalPages,
  currentPage,
  q,
  products,
  departments,
}: StaffClientProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("page", String(nextPage));
    return `/dashboard/users?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-semibold text-gray-900">Staff</div>
      </div>

      <div className="flex items-center gap-3">
        <AddStaffModal products={products} departments={departments} />
        <form action="/dashboard/users" method="get" className="flex items-center gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search staff..."
            className="w-80 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </form>
        <div className="ml-auto">
          <AssignProductModal
            products={products}
            staffOptions={staff.map((member) => ({ id: member.id, name: member.name }))}
            triggerLabel="Assign"
            triggerIcon="+"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-2 shadow-sm">
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
                <TableCell className="font-medium text-gray-900">
                  {member.name}
                </TableCell>
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

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={pageHref(Math.max(1, currentPage - 1))} />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={pageHref(pageNumber)}
                  isActive={pageNumber === currentPage}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext href={pageHref(Math.min(totalPages, currentPage + 1))} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

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
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedStaff.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {toLabel(selectedStaff.department)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button">Edit</Button>
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
                  <div className="text-xs font-semibold uppercase text-gray-400">
                    Department
                  </div>
                  <div className="text-sm text-gray-900">
                    {toLabel(selectedStaff.department)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">
                    Inventory Using
                  </div>
                  <div className="text-sm text-gray-900">
                    {selectedStaff.inventoryUsingCount}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-gray-400">
                    Updated
                  </div>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedStaff.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <div className="mb-3 text-sm font-semibold text-gray-700">
                  Assigned Inventory
                </div>
                <div className="space-y-2">
                  {selectedStaff.inventoryUsing.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-4"
                    >
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">
                          SKU
                        </div>
                        <div className="text-sm text-gray-900">
                          {assignment.product.sku}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">
                          Product
                        </div>
                        <div className="text-sm text-gray-900">
                          {assignment.product.product}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">
                          Quantity
                        </div>
                        <div className="text-sm text-gray-900">
                          {assignment.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-400">
                          Assigned At
                        </div>
                        <div className="text-sm text-gray-900">
                          {new Date(assignment.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedStaff.inventoryUsing.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No inventory assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
