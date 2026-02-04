import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
  departmentId?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Payload;

  const name = body.name?.trim();
  const departmentId = body.departmentId?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!departmentId) {
    return NextResponse.json({ error: "Department is required." }, { status: 400 });
  }

  const department = await prisma.departmentModel.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });
  if (!department) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  try {
    const staff = await prisma.$transaction(async (tx) => {
      const updated = await tx.staff.update({
        where: { id },
        data: {
          name,
          departmentId,
        },
        include: {
          department: { select: { id: true, name: true } },
        },
      });

      await tx.product.updateMany({
        where: {
          staffAssignments: {
            some: {
              staffId: id,
              returnDate: null,
            },
          },
        },
        data: {
          assignedTo: name,
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        staff: {
          id: staff.id,
          name: staff.name,
          departmentId: staff.department.id,
          department: staff.department.name,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update staff." }, { status: 500 });
  }
}
