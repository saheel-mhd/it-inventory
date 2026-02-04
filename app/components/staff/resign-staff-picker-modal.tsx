"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";
import SearchInput from "~/app/components/ui/search-input";

type StaffAssignment = {
  id: string;
  startDate: string;
  returnDate: string | null;
  product: {
    product: string;
    sku: string;
  };
};

type StaffRow = {
  id: string;
  name: string;
  department: string;
  inventoryUsing: StaffAssignment[];
};

type ResignStaffPickerModalProps = {
  staff: StaffRow[];
};

export default function ResignStaffPickerModal({ staff }: ResignStaffPickerModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((item) => item.name.toLowerCase().includes(q));
  }, [query, staff]);

  const activeAssignments = useMemo(
    () => selectedStaff?.inventoryUsing.filter((item) => item.returnDate === null) ?? [],
    [selectedStaff],
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStaff) return;

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/resign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          items: activeAssignments.map((assignment) => ({
            assignmentId: assignment.id,
            note: null,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Failed to resign staff.");
        return;
      }
      setOpen(false);
      setQuery("");
      setSelectedStaffId("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button type="button" className="bg-red-700 hover:bg-red-800" onClick={() => setOpen(true)}>
        Resign
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close resign popup"
          />
          <div className="relative w-full max-w-4xl px-4" role="dialog" aria-modal="true">
            <div className="rounded-2xl bg-white shadow-xl">
              <div className="border-b px-5 py-4">
                <div className="text-lg font-semibold text-gray-900">Resign Staff</div>
              </div>

              <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Select Staff</div>
                  <SearchInput
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedStaffId("");
                    }}
                    placeholder="Search staff by name..."
                    className="w-full"
                  />
                  {query.trim().length > 0 && (
                    <div className="max-h-44 overflow-auto rounded-md border border-gray-200">
                      {filteredStaff.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No staff found.</div>
                      ) : (
                        filteredStaff.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setSelectedStaffId(item.id);
                              setQuery(item.name);
                            }}
                          >
                            <span>{item.name}</span>
                            <span className="text-xs text-gray-500">{item.department}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-3">
                  {!selectedStaff ? (
                    <div className="text-sm text-gray-600">No user is selected.</div>
                  ) : activeAssignments.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      This staff has no active products. Confirm resign will mark this staff inactive.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-3"
                        >
                          <div>
                            <div className="text-xs font-semibold uppercase text-gray-400">Product</div>
                            <div className="text-sm text-gray-900">{assignment.product.product}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-gray-400">SKU</div>
                            <div className="text-sm text-gray-900">{assignment.product.sku}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-gray-400">Assigned At</div>
                            <div className="text-sm text-gray-900">
                              {new Date(assignment.startDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={!selectedStaff || isSubmitting}>
                    {isSubmitting ? "Saving..." : "Confirm Resign"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
