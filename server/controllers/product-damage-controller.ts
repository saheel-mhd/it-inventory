import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { parseJson } from "~/server/middleware/route";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

type DamagePayload = {
  productId?: string;
  repairable?: boolean;
  sentToService?: boolean;
  serviceVendor?: string | null;
  serviceReturnDate?: string | null;
  notes?: string | null;
};

export async function createProductDamage(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<DamagePayload>(request);

  if (!body.productId) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }
  if (typeof body.repairable !== "boolean") {
    return NextResponse.json(
      { error: "Repairable selection is required." },
      { status: 400 },
    );
  }
  if (body.repairable && typeof body.sentToService !== "boolean") {
    return NextResponse.json(
      { error: "Sent to service selection is required." },
      { status: 400 },
    );
  }
  if (body.repairable && body.sentToService) {
    if (!body.serviceVendor) {
      return NextResponse.json({ error: "Service vendor is required." }, { status: 400 });
    }
    if (!body.serviceReturnDate) {
      return NextResponse.json(
        { error: "Service return date is required." },
        { status: 400 },
      );
    }
  }

  const expectedReturnDate =
    body.repairable && body.sentToService && body.serviceReturnDate
      ? new Date(body.serviceReturnDate)
      : null;
  if (expectedReturnDate && Number.isNaN(expectedReturnDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid service return date." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.productService.create({
      data: {
        productId: body.productId!,
        repairable: body.repairable!,
        notes: body.repairable ? null : body.notes?.trim() || null,
        sentToService: body.repairable ? Boolean(body.sentToService) : false,
        vendorName: body.sentToService ? body.serviceVendor?.trim() || null : null,
        expectedReturnDate,
        ...createActorCreateFields(actor),
      },
    });

    await tx.product.update({
      where: { id: body.productId! },
      data: {
        status: body.repairable
          ? body.sentToService
            ? "UNDER_SERVICE"
            : "SERVICEABLE"
          : "DAMAGED",
        assignedTo: body.repairable ? undefined : null,
        ...createActorUpdateFields(actor),
      },
    });

    if (!body.repairable) {
      await tx.staffInventory.updateMany({
        where: { productId: body.productId!, returnDate: null },
        data: {
          returnDate: new Date(),
          returnReason: "DAMAGED",
          returnReasonNote: body.notes?.trim() || "Marked as damaged",
          ...createActorUpdateFields(actor),
        },
      });
    }

    await writeAuditLog(tx, {
      actor,
      action: "PRODUCT_DAMAGE_RECORDED",
      entityType: "Product",
      entityId: body.productId!,
      summary: "Recorded product damage status.",
      metadata: {
        repairable: body.repairable,
        sentToService: body.sentToService ?? false,
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
