import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { ReturnReason } from "@prisma/client";

type Payload = {
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

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

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
  if (body.reason === "DAMAGED" && body.repairable) {
    if (typeof body.sentToService !== "boolean") {
      return NextResponse.json(
        { error: "Sent to service selection is required." },
        { status: 400 },
      );
    }
    if (body.sentToService) {
      if (!body.serviceVendor?.trim()) {
        return NextResponse.json(
          { error: "Service vendor is required." },
          { status: 400 },
        );
      }
      if (!body.serviceReturnDate) {
        return NextResponse.json(
          { error: "Service return date is required." },
          { status: 400 },
        );
      }
    }
  }
  if (body.reason === "DAMAGED" && body.repairable === false) {
    if (!body.damageReason?.trim()) {
      return NextResponse.json(
        { error: "Damage reason is required." },
        { status: 400 },
      );
    }
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
        },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
