import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma } from "@prisma/client";

type Payload = {
  productId?: string;
  serviced?: boolean;
  serviceDate?: string;
  serviceCost?: string;
  serviceMessage?: string;
  serviceFailureReason?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

  if (!body.productId) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }
  if (typeof body.serviced !== "boolean") {
    return NextResponse.json(
      { error: "Serviced selection is required." },
      { status: 400 },
    );
  }

  const serviceDate = body.serviceDate ? new Date(body.serviceDate) : new Date();
  if (Number.isNaN(serviceDate.getTime())) {
    return NextResponse.json({ error: "Invalid service date." }, { status: 400 });
  }

  const serviceCostRaw = body.serviceCost != null ? String(body.serviceCost).trim() : "";
  const serviceCost = serviceCostRaw.length > 0 ? serviceCostRaw : null;
  if (serviceCost !== null && !Number.isFinite(Number(serviceCost))) {
    return NextResponse.json({ error: "Invalid service cost." }, { status: 400 });
  }

  if (!body.serviced) {
    if (!body.serviceFailureReason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required." },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: body.productId! },
        select: {
          id: true,
          assignedTo: true,
          staffAssignments: {
            where: { returnDate: null },
            orderBy: { startDate: "desc" },
            take: 1,
            include: { staff: { select: { name: true } } },
          },
        },
      });

      if (!product) {
        throw new Error("Product not found.");
      }

      const openService = await tx.productService.findFirst({
        where: {
          productId: product.id,
          sentToService: true,
          serviced: null,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (!openService) {
        throw new Error("No open service record found for this product.");
      }

      const latestAssignment = product.staffAssignments[0];
      const assignedName =
        product.assignedTo ?? latestAssignment?.staff?.name ?? null;

      if (body.serviced) {
        await tx.productService.update({
          where: { id: openService.id },
          data: {
            serviced: true,
            serviceDate,
            serviceCost,
            serviceMessage: body.serviceMessage?.trim() || null,
            serviceFailureReason: null,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            // Returned from service: back to active use if assigned, otherwise available.
            status: assignedName ? "ACTIVE_USE" : "AVAILABLE",
            assignedTo: assignedName,
          },
        });
      } else {
        await tx.productService.update({
          where: { id: openService.id },
          data: {
            serviced: false,
            serviceDate,
            serviceCost: null,
            serviceMessage: null,
            serviceFailureReason: body.serviceFailureReason!.trim(),
          },
        });

        // Service failed / not repaired -> mark damaged and unassign from staff.
        await tx.product.update({
          where: { id: product.id },
          data: {
            status: "DAMAGED",
            assignedTo: null,
          },
        });

        await tx.staffInventory.updateMany({
          where: { productId: product.id, returnDate: null },
          data: { returnDate: new Date(), returnReason: body.serviceFailureReason!.trim() },
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Service update failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Service update failed (${error.code}).`, meta: error.meta ?? null },
        { status: 500 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Service update failed." }, { status: 500 });
  }
}
