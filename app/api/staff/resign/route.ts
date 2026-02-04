import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type ItemPayload = {
  assignmentId: string;
  note?: string | null;
};

type Payload = {
  staffId?: string;
  items?: ItemPayload[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

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

  const notesById = new Map(items.map((item) => [item.assignmentId, item.note?.trim() || null]));

  await prisma.$transaction(async (tx) => {
    if (assignments.length > 0) {
      for (const assignment of assignments) {
        await tx.staffInventory.update({
          where: { id: assignment.id },
          data: {
            returnDate: new Date(),
            returnReason: "RESIGNED",
            returnReasonNote: notesById.get(assignment.id) ?? null,
          },
        });

        await tx.product.update({
          where: { id: assignment.productId },
          data: {
            assignedTo: null,
            status: "AVAILABLE",
          },
        });
      }
    }

    await tx.staff.update({
      where: { id: body.staffId! },
      data: { isActive: false },
    });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
