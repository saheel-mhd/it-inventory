import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  productId?: string;
  repairable?: boolean;
  sentToService?: boolean;
  serviceVendor?: string | null;
  serviceReturnDate?: string | null;
  notes?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

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

  const sentToService = body.repairable ? (body.sentToService ?? false) : false;
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

  await prisma.$transaction(async (tx) => {
    await tx.productService.create({
      data: {
        productId: body.productId!,
        repairable: body.repairable,
        notes: body.repairable ? null : body.notes?.trim() || null,
        sentToService,
        vendorName: sentToService ? body.serviceVendor?.trim() || null : null,
        expectedReturnDate,
      },
    });

    await tx.product.update({
      where: { id: body.productId },
      data: {
        status: body.repairable
          ? sentToService
            ? "UNDER_SERVICE"
            : "SERVICEABLE"
          : "DAMAGED",
        assignedTo: body.repairable ? undefined : null,
      },
    });

    if (!body.repairable) {
      await tx.staffInventory.updateMany({
        where: { productId: body.productId, returnDate: null },
        data: { returnDate: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
