import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type AssignmentPayload = {
  productId: string;
  quantity?: number;
  startDate?: string;
};

type StaffPayload = {
  name?: string;
  departmentId?: string;
  assignments?: AssignmentPayload[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as StaffPayload;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!body.departmentId) {
    return NextResponse.json({ error: "Department is required." }, { status: 400 });
  }
  const staffName = body.name.trim();
  const departmentId = body.departmentId;
  const assignments = body.assignments ?? [];

  const department = await prisma.departmentModel.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });
  if (!department) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staff.create({
      data: {
        name: staffName,
        departmentId: department.id,
        ...(assignments.length > 0
          ? {
              inventoryUsing: {
                create: assignments.map((assignment) => ({
                  productId: assignment.productId,
                  quantity: assignment.quantity ?? 1,
                  startDate: assignment.startDate
                    ? new Date(assignment.startDate)
                    : new Date(),
                })),
              },
            }
          : {}),
      },
    });

    if (assignments.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: assignments.map((a) => a.productId) } },
        data: {
          assignedTo: staffName,
          status: "ACTIVE_USE",
        },
      });
    }

    return created;
  });

  return NextResponse.json({ staff }, { status: 201 });
}
