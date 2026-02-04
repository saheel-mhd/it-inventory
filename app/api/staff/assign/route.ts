import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  staffId?: string;
  productId?: string;
  quantity?: number;
  startDate?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

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
    return NextResponse.json({ error: "Cannot assign product to inactive staff." }, { status: 400 });
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.staffInventory.create({
      data: {
        staffId: staff.id,
        productId: body.productId!,
        quantity: body.quantity ?? 1,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
      },
    });

    await tx.product.update({
      where: { id: body.productId! },
      data: {
        assignedTo: staff.name,
        status: "ACTIVE_USE",
      },
    });

    return created;
  });

  return NextResponse.json({ assignment }, { status: 201 });
}
