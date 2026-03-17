import { ReturnReason } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { parseJson } from "~/server/middleware/route";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

type AssignPayload = {
  staffId?: string;
  productId?: string;
  quantity?: number;
  startDate?: string;
};

type ResignPayload = {
  staffId?: string;
  items?: Array<{
    assignmentId: string;
    note?: string | null;
  }>;
};

type ReturnPayload = {
  assignmentId?: string;
  reason?: ReturnReason | string;
  otherReason?: string | null;
  notes?: string | null;
  repairable?: boolean | null;
  sentToService?: boolean | null;
  serviceVendor?: string | null;
  serviceReturnDate?: string | null;
  damageReason?: string | null;
};

const reasonLabel = (value: ReturnReason) => {
  switch (value) {
    case "RESIGNED":
      return "Resigned";
    case "DAMAGED":
      return "Damaged";
    case "NOT_NEEDED":
      return "Not needed anymore";
    default:
      return "Other";
  }
};

export async function assignProductToStaff(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<AssignPayload>(request);

  if (!body.staffId) {
    return NextResponse.json({ error: "Staff is required." }, { status: 400 });
  }
  if (!body.productId) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: body.staffId },
    select: { id: true, name: true, isActive: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "Staff not found." }, { status: 404 });
  }
  if (!staff.isActive) {
    return NextResponse.json(
      { error: "Cannot assign product to inactive staff." },
      { status: 400 },
    );
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.staffInventory.create({
      data: {
        staffId: staff.id,
        productId: body.productId!,
        quantity: body.quantity ?? 1,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        ...createActorCreateFields(actor),
      },
    });

    await tx.product.update({
      where: { id: body.productId! },
      data: {
        assignedTo: staff.name,
        status: "ACTIVE_USE",
        ...createActorUpdateFields(actor),
      },
    });

    await writeAuditLog(tx, {
      actor,
      action: "PRODUCT_ASSIGNED",
      entityType: "StaffInventory",
      entityId: created.id,
      summary: `Assigned product to "${staff.name}".`,
      metadata: { staffId: staff.id, productId: body.productId! },
    });

    return created;
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

export async function resignStaff(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<ResignPayload>(request);

  if (!body.staffId) {
    return NextResponse.json({ error: "Staff is required." }, { status: 400 });
  }

  const items = (body.items ?? []).filter((item) => item.assignmentId);
  const assignmentIds = items.map((item) => item.assignmentId);
  const assignments =
    assignmentIds.length > 0
      ? await prisma.staffInventory.findMany({
          where: {
            id: { in: assignmentIds },
            staffId: body.staffId,
            returnDate: null,
          },
          select: { id: true, productId: true },
        })
      : [];

  if (assignmentIds.length > 0 && assignments.length !== assignmentIds.length) {
    return NextResponse.json(
      { error: "Some assignments are invalid or already returned." },
      { status: 400 },
    );
  }

  const notesById = new Map(
    items.map((item) => [item.assignmentId, item.note?.trim() || null]),
  );

  await prisma.$transaction(async (tx) => {
    for (const assignment of assignments) {
      await tx.staffInventory.update({
        where: { id: assignment.id },
        data: {
          returnDate: new Date(),
          returnReason: "RESIGNED",
          returnReasonNote: notesById.get(assignment.id) ?? null,
          ...createActorUpdateFields(actor),
        },
      });

      await tx.product.update({
        where: { id: assignment.productId },
        data: {
          assignedTo: null,
          status: "AVAILABLE",
          ...createActorUpdateFields(actor),
        },
      });
    }

    await tx.staff.update({
      where: { id: body.staffId! },
      data: { isActive: false, ...createActorUpdateFields(actor) },
    });

    await writeAuditLog(tx, {
      actor,
      action: "STAFF_RESIGNED",
      entityType: "Staff",
      entityId: body.staffId!,
      summary: "Processed staff resignation and returned active assignments.",
      metadata: { assignmentsReturned: assignments.length },
    });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function returnStaffProduct(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<ReturnPayload>(request);

  if (!body.assignmentId) {
    return NextResponse.json({ error: "Assignment is required." }, { status: 400 });
  }
  if (!body.reason) {
    return NextResponse.json({ error: "Return reason is required." }, { status: 400 });
  }
  if (body.reason === "OTHER" && !body.otherReason?.trim()) {
    return NextResponse.json({ error: "Return reason is required." }, { status: 400 });
  }
  if (body.reason === "DAMAGED" && typeof body.repairable !== "boolean") {
    return NextResponse.json(
      { error: "Serviceable selection is required." },
      { status: 400 },
    );
  }
  if (body.reason === "DAMAGED" && body.repairable && typeof body.sentToService !== "boolean") {
    return NextResponse.json(
      { error: "Sent to service selection is required." },
      { status: 400 },
    );
  }
  if (body.reason === "DAMAGED" && body.repairable && body.sentToService) {
    if (!body.serviceVendor?.trim()) {
      return NextResponse.json({ error: "Service vendor is required." }, { status: 400 });
    }
    if (!body.serviceReturnDate) {
      return NextResponse.json(
        { error: "Service return date is required." },
        { status: 400 },
      );
    }
  }
  if (body.reason === "DAMAGED" && body.repairable === false && !body.damageReason?.trim()) {
    return NextResponse.json({ error: "Damage reason is required." }, { status: 400 });
  }

  const reason = Object.values(ReturnReason).includes(body.reason as ReturnReason)
    ? (body.reason as ReturnReason)
    : null;
  if (!reason) {
    return NextResponse.json({ error: "Invalid return reason." }, { status: 400 });
  }

  const returnReasonNote =
    reason === "OTHER"
      ? body.otherReason!.trim()
      : reason === "RESIGNED"
        ? body.notes?.trim() || null
        : reason === "DAMAGED" && body.repairable === false
          ? body.damageReason!.trim()
          : null;

  const isDamaged = reason === "DAMAGED";
  const repairable = isDamaged ? Boolean(body.repairable) : false;
  const sentToService = isDamaged && repairable ? Boolean(body.sentToService) : false;
  const expectedReturnDate =
    sentToService && body.serviceReturnDate
      ? new Date(body.serviceReturnDate)
      : null;
  if (expectedReturnDate && Number.isNaN(expectedReturnDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid service return date." },
      { status: 400 },
    );
  }

  const assignment = await prisma.staffInventory.findUnique({
    where: { id: body.assignmentId },
    include: { product: true, staff: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }
  if (assignment.returnDate) {
    return NextResponse.json(
      { error: "This assignment was already returned." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.staffInventory.update({
      where: { id: assignment.id },
      data: {
        returnDate: new Date(),
        returnReason: reason,
        returnReasonNote,
        ...createActorUpdateFields(actor),
      },
    });

    await tx.product.update({
      where: { id: assignment.productId },
      data: {
        assignedTo: null,
        status: isDamaged
          ? repairable
            ? sentToService
              ? "UNDER_SERVICE"
              : "SERVICEABLE"
            : "DAMAGED"
          : "AVAILABLE",
        ...createActorUpdateFields(actor),
      },
    });

    if (isDamaged) {
      await tx.productService.create({
        data: {
          productId: assignment.productId,
          repairable,
          notes: returnReasonNote ?? reasonLabel(reason),
          sentToService,
          vendorName: sentToService ? body.serviceVendor!.trim() : null,
          expectedReturnDate,
          ...createActorCreateFields(actor),
        },
      });
    }

    await writeAuditLog(tx, {
      actor,
      action: isDamaged ? "PRODUCT_RETURNED_DAMAGED" : "PRODUCT_RETURNED",
      entityType: "StaffInventory",
      entityId: assignment.id,
      summary: `Processed product return for "${assignment.staff.name}".`,
      metadata: { productId: assignment.productId, reason },
    });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
