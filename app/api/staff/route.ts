import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Department } from "@prisma/client";

type AssignmentPayload = {
  productId: string;
  quantity?: number;
  startDate?: string;
};

type StaffPayload = {
  name?: string;
  department?: string;
  assignments?: AssignmentPayload[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as StaffPayload;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!body.department) {
    return NextResponse.json({ error: "Department is required." }, { status: 400 });
  }
  if (!body.assignments || body.assignments.length === 0) {
    return NextResponse.json({ error: "At least one product is required." }, { status: 400 });
  }

  const staffName = body.name.trim();

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staff.create({
      data: {
        name: staffName,
        department: body.department as Department,
        inventoryUsing: {
          create: body.assignments.map((assignment) => ({
            productId: assignment.productId,
            quantity: assignment.quantity ?? 1,
            startDate: assignment.startDate
              ? new Date(assignment.startDate)
              : new Date(),
          })),
        },
      },
    });

    await tx.product.updateMany({
      where: { id: { in: body.assignments.map((a) => a.productId) } },
      data: {
        assignedTo: staffName,
        status: "ACTIVE_USE",
      },
    });

    return created;
  });

  return NextResponse.json({ staff }, { status: 201 });
}
