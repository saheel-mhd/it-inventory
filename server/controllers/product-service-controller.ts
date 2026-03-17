import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import { parseJson, serverError } from "~/server/middleware/route";
import {
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";
import { parseCostValue } from "~/server/services/product-utils";

type ProductServicePayload = {
  productId?: string;
  serviced?: boolean;
  serviceDate?: string;
  serviceCost?: string;
  serviceMessage?: string;
  serviceFailureReason?: string;
};

export async function completeProductService(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<ProductServicePayload>(request);

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

  const serviceCost = parseCostValue(body.serviceCost, "Invalid service cost.");
  if (serviceCost.error) {
    return NextResponse.json({ error: serviceCost.error }, { status: 400 });
  }

  if (!body.serviced && !body.serviceFailureReason?.trim()) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
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
        where: { productId: product.id, sentToService: true, serviced: null },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!openService) {
        throw new Error("No open service record found for this product.");
      }

      const latestAssignment = product.staffAssignments[0];
      const assignedName = product.assignedTo ?? latestAssignment?.staff?.name ?? null;

      if (body.serviced) {
        await tx.productService.update({
          where: { id: openService.id },
          data: {
            serviced: true,
            serviceDate,
            serviceCost: serviceCost.value,
            serviceMessage: body.serviceMessage?.trim() || null,
            serviceFailureReason: null,
            ...createActorUpdateFields(actor),
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            status: assignedName ? "ACTIVE_USE" : "AVAILABLE",
            assignedTo: assignedName,
            ...createActorUpdateFields(actor),
          },
        });

        await writeAuditLog(tx, {
          actor,
          action: "PRODUCT_SERVICE_COMPLETED",
          entityType: "Product",
          entityId: product.id,
          summary: "Completed product service successfully.",
          metadata: { serviced: true },
        });
        return;
      }

      await tx.productService.update({
        where: { id: openService.id },
        data: {
          serviced: false,
          serviceDate,
          serviceCost: null,
          serviceMessage: null,
          serviceFailureReason: body.serviceFailureReason!.trim(),
          ...createActorUpdateFields(actor),
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          status: "DAMAGED",
          assignedTo: null,
          ...createActorUpdateFields(actor),
        },
      });

      await tx.staffInventory.updateMany({
        where: { productId: product.id, returnDate: null },
        data: {
          returnDate: new Date(),
          returnReason: "DAMAGED",
          returnReasonNote: body.serviceFailureReason!.trim(),
          ...createActorUpdateFields(actor),
        },
      });

      await writeAuditLog(tx, {
        actor,
        action: "PRODUCT_SERVICE_FAILED",
        entityType: "Product",
        entityId: product.id,
        summary: "Closed product service as failed.",
        metadata: { serviced: false },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Service update failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return serverError({
        error: `Service update failed (${error.code}).`,
        meta: error.meta ?? null,
      });
    }
    if (error instanceof Error) {
      return serverError({ error: error.message });
    }
    return serverError({ error: "Service update failed." });
  }
}
