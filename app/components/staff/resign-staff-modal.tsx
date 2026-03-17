"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Button from "~/app/components/ui/button";

type StaffAssignment = {
  id: string;
  startDate: string;
  returnDate: string | null;
  product: {
    product: string;
    sku: string;
  };
};

type StaffData = {
  id: string;
  name: string;
  department: string;
  updatedAt: string;
  inventoryUsingCount: number;
  inventoryUsing: StaffAssignment[];
};

type ResignStaffModalProps = {
  staff: StaffData;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  triggerClassName?: string;
};

export default function ResignStaffModal({
  staff,
  triggerLabel = "Resign",
  triggerIcon,
  triggerClassName,
}: ResignStaffModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const activeAssignments = useMemo(
    () => staff.inventoryUsing.filter((item) => item.returnDate === null),
    [staff.inventoryUsing],
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/resign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          items: activeAssignments.map((assignment) => ({
            assignmentId: assignment.id,
            note: notes[assignment.id] || null,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Failed to resign staff.");
        return;
      }
      setOpen(false);
      setNotes({});
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        className={triggerClassName ?? "bg-red-700 hover:bg-red-800"}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center justify-center">
          {triggerIcon ?? triggerLabel}
        </span>
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
                <div className="mt-2 grid gap-2 text-sm text-gray-700 md:grid-cols-4">
                  <div><span className="font-medium">Name:</span> {staff.name}</div>
                  <div><span className="font-medium">Department:</span> {staff.department}</div>
                  <div><span className="font-medium">Inventory Using:</span> {staff.inventoryUsingCount}</div>
                  <div><span className="font-medium">Updated:</span> {new Date(staff.updatedAt).toLocaleDateString()}</div>
                </div>
                {activeAssignments.length > 0 && (
                  <div className="mt-3">
                    <a
                      href={`/handovers/resign/${staff.id}`}
                      target="_blank"
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Print Handover Form
                    </a>
                  </div>
                )}
              </div>

              <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
                <div className="space-y-3">
                  {activeAssignments.map((assignment) => (
                    <div key={assignment.id} className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-4">
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
                        <div className="text-sm text-gray-900">{new Date(assignment.startDate).toLocaleDateString()}</div>
                      </div>
                      <label className="text-sm font-medium text-gray-700">
                        Notes
                        <input
                          value={notes[assignment.id] ?? ""}
                          onChange={(event) =>
                            setNotes((prev) => ({ ...prev, [assignment.id]: event.target.value }))
                          }
                          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Damage, missing accessories, etc."
                        />
                      </label>
                    </div>
                  ))}
                  {activeAssignments.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                      This staff has no active products. Confirm resign will mark this staff inactive.
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
                  <Button type="submit" disabled={isSubmitting}>
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
