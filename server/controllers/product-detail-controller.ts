import { Prisma, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import { RouteContext, parseJson, serverError } from "~/server/middleware/route";
import {
  isProductStatus,
  parseCostValue,
  parseOptionalDateValue,
  ProductPayload,
  statusNeedsUnassign,
  statusReturnReason,
  statusReturnReasonNote,
} from "~/server/services/product-utils";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

export async function updateProduct(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<ProductPayload>(request);
  const errors: Record<string, string> = {};

  if (!body.product?.trim()) errors.product = "Product name is required.";
  if (!body.brand?.trim()) errors.brand = "Brand is required.";
  if (!body.sku?.trim()) errors.sku = "SKU is required.";
  if (!body.categoryId) errors.categoryId = "Category is required.";
  if (!body.assetTypeId) errors.assetTypeId = "Asset type is required.";
  if (!body.status || !isProductStatus(body.status)) errors.status = "Status is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const orderedDate = parseOptionalDateValue(
    body.orderedDate,
    "Invalid ordered date.",
  );
  if (orderedDate.error) {
    return NextResponse.json(
      { errors: { orderedDate: orderedDate.error } },
      { status: 400 },
    );
  }

  const warrantyExpire = parseOptionalDateValue(
    body.warrantyExpire,
    "Invalid warranty expire date.",
  );
  if (warrantyExpire.error) {
    return NextResponse.json(
      { errors: { warrantyExpire: warrantyExpire.error } },
      { status: 400 },
    );
  }

  const cost = parseCostValue(body.cost);
  if (cost.error) {
    return NextResponse.json({ errors: { cost: cost.error } }, { status: 400 });
  }

  const statusValue = body.status as ProductStatus;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
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

      const latestAssignment = product.staffAssignments[0];
      const assignedName = product.assignedTo ?? latestAssignment?.staff?.name ?? null;

      await tx.product.update({
        where: { id },
        data: {
          product: body.product!.trim(),
          brand: body.brand!.trim(),
          sku: body.sku!.trim(),
          snNumber: body.snNumber?.trim() || null,
          specification: body.specification?.trim() || null,
          orderedDate: orderedDate.value,
          cost: cost.value,
          warrantyPeriodId: body.warrantyPeriodId ?? null,
          warrantyExpire: warrantyExpire.value,
          categoryId: body.categoryId!,
          assetTypeId: body.assetTypeId!,
          status: statusValue,
          assignedTo:
            statusValue === "ACTIVE_USE"
              ? assignedName
              : statusNeedsUnassign(statusValue)
                ? null
                : assignedName,
          ...createActorUpdateFields(actor),
        },
      });

      if (statusNeedsUnassign(statusValue)) {
        await tx.staffInventory.updateMany({
          where: { productId: id, returnDate: null },
          data: {
            returnDate: new Date(),
            returnReason: statusReturnReason(statusValue),
            returnReasonNote: statusReturnReasonNote(statusValue),
            ...createActorUpdateFields(actor),
          },
        });
      }

      if (
        statusValue === "DAMAGED" ||
        statusValue === "SERVICEABLE" ||
        statusValue === "UNDER_SERVICE"
      ) {
        await tx.productService.create({
          data: {
            productId: id,
            repairable: statusValue !== "DAMAGED",
            notes: statusReturnReasonNote(statusValue),
            sentToService: statusValue === "UNDER_SERVICE",
            vendorName: null,
            expectedReturnDate: null,
            ...createActorCreateFields(actor),
          },
        });
      }

      await writeAuditLog(tx, {
        actor,
        action: "PRODUCT_UPDATED",
        entityType: "Product",
        entityId: id,
        summary: `Updated product "${body.product!.trim()}".`,
        metadata: { sku: body.sku!.trim(), status: statusValue },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Update product failed", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { errors: { snNumber: "SN Number already exists." } },
          { status: 400 },
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            errors: {
              categoryId: "Invalid category.",
              assetTypeId: "Invalid asset type.",
              warrantyPeriodId: "Invalid warranty period.",
            },
          },
          { status: 400 },
        );
      }

      return serverError({
        error: `Failed to update product (${error.code}).`,
        meta: error.meta ?? null,
      });
    }

    if (error instanceof Error) {
      return serverError({ error: error.message });
    }

    return serverError({ error: "Failed to update product." });
  }
}
