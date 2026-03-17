import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import { parseJson, serverError, RouteContext } from "~/server/middleware/route";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

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

export async function createStaff(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<StaffPayload>(request);

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!body.departmentId) {
    return NextResponse.json({ error: "Department is required." }, { status: 400 });
  }

  const department = await prisma.departmentModel.findUnique({
    where: { id: body.departmentId },
    select: { id: true },
  });
  if (!department) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  const staffName = body.name.trim();
  const assignments = body.assignments ?? [];

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staff.create({
      data: {
        name: staffName,
        departmentId: department.id,
        ...createActorCreateFields(actor),
        ...(assignments.length > 0
          ? {
              inventoryUsing: {
                create: assignments.map((assignment) => ({
                  productId: assignment.productId,
                  quantity: assignment.quantity ?? 1,
                  startDate: assignment.startDate
                    ? new Date(assignment.startDate)
                    : new Date(),
                  ...createActorCreateFields(actor),
                })),
              },
            }
          : {}),
      },
    });

    if (assignments.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: assignments.map((assignment) => assignment.productId) } },
        data: {
          assignedTo: staffName,
          status: "ACTIVE_USE",
          ...createActorUpdateFields(actor),
        },
      });
    }

    await writeAuditLog(tx, {
      actor,
      action: "STAFF_CREATED",
      entityType: "Staff",
      entityId: created.id,
      summary: `Created staff "${staffName}".`,
      metadata: { assignments: assignments.length },
    });

    return created;
  });

  return NextResponse.json({ staff }, { status: 201 });
}

export async function updateStaff(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<Pick<StaffPayload, "name" | "departmentId">>(request);
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
        data: { name, departmentId, ...createActorUpdateFields(actor) },
        include: { department: { select: { id: true, name: true } } },
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
        data: { assignedTo: name, ...createActorUpdateFields(actor) },
      });

      await writeAuditLog(tx, {
        actor,
        action: "STAFF_UPDATED",
        entityType: "Staff",
        entityId: updated.id,
        summary: `Updated staff "${updated.name}".`,
        metadata: { departmentId },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }
    return serverError({ error: "Failed to update staff." });
  }
}
