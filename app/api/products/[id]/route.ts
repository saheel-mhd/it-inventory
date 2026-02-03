import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma, ProductStatus } from "@prisma/client";

type Payload = {
  product?: string;
  brand?: string;
  snNumber?: string | null;
  sku?: string;
  specification?: string | null;
  orderedDate?: string | null;
  cost?: string | null;
  warranty?: "THREE_MONTHS" | "SIX_MONTHS" | "ONE_YEAR" | null;
  warrantyExpire?: string | null;
  categoryId?: string;
  assetTypeId?: string;
  status?: string;
};

const statusNeedsUnassign = (status: ProductStatus) =>
  status === "AVAILABLE" ||
  status === "DAMAGED" ||
  status === "SERVICEABLE" ||
  status === "UNDER_SERVICE";

const statusReturnReason = (status: ProductStatus) =>
  status === "DAMAGED" || status === "SERVICEABLE" || status === "UNDER_SERVICE"
    ? "DAMAGED"
    : "NOT_NEEDED";

const statusReturnReasonNote = (status: ProductStatus) => {
  if (status === "DAMAGED") return "Marked damaged via edit";
  if (status === "SERVICEABLE") return "Marked serviceable via edit";
  if (status === "UNDER_SERVICE") return "Sent to service via edit";
  return "Updated via edit";
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Payload;
  const errors: Record<string, string> = {};

  if (!body.product?.trim()) errors.product = "Product name is required.";
  if (!body.brand?.trim()) errors.brand = "Brand is required.";
  if (!body.sku?.trim()) errors.sku = "SKU is required.";
  if (!body.categoryId) errors.categoryId = "Category is required.";
  if (!body.assetTypeId) errors.assetTypeId = "Asset type is required.";

  const status = Object.values(ProductStatus).includes(body.status as ProductStatus)
    ? (body.status as ProductStatus)
    : null;
  if (!status) errors.status = "Status is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const orderedDate = body.orderedDate ? new Date(body.orderedDate) : null;
  if (orderedDate && Number.isNaN(orderedDate.getTime())) {
    return NextResponse.json(
      { errors: { orderedDate: "Invalid ordered date." } },
      { status: 400 },
    );
  }

  const warrantyExpire = body.warrantyExpire ? new Date(body.warrantyExpire) : null;
  if (warrantyExpire && Number.isNaN(warrantyExpire.getTime())) {
    return NextResponse.json(
      { errors: { warrantyExpire: "Invalid warranty expire date." } },
      { status: 400 },
    );
  }

  const costRaw = body.cost != null ? String(body.cost).trim() : "";
  const cost = costRaw.length > 0 ? costRaw : null;
  if (cost !== null && !Number.isFinite(Number(cost))) {
    return NextResponse.json(
      { errors: { cost: "Invalid cost." } },
      { status: 400 },
    );
  }

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
      const assignedName =
        product.assignedTo ?? latestAssignment?.staff?.name ?? null;

      await tx.product.update({
        where: { id },
        data: {
          product: body.product!.trim(),
          brand: body.brand!.trim(),
          sku: body.sku!.trim(),
          snNumber: body.snNumber?.trim() || null,
          specification: body.specification?.trim() || null,
          orderedDate,
          cost,
          warranty: body.warranty ?? null,
          warrantyExpire,
          categoryId: body.categoryId!,
          assetTypeId: body.assetTypeId!,
          status,
          assignedTo:
            status === "ACTIVE_USE"
              ? assignedName
              : statusNeedsUnassign(status)
                ? null
                : assignedName,
        },
      });

      if (statusNeedsUnassign(status)) {
        await tx.staffInventory.updateMany({
          where: { productId: id, returnDate: null },
          data: {
            returnDate: new Date(),
            returnReason: statusReturnReason(status),
            returnReasonNote: statusReturnReasonNote(status),
          },
        });
      }

      if (status === "DAMAGED" || status === "SERVICEABLE" || status === "UNDER_SERVICE") {
        await tx.productService.create({
          data: {
            productId: id,
            repairable: status !== "DAMAGED",
            notes: statusReturnReasonNote(status),
            sentToService: status === "UNDER_SERVICE",
            vendorName: null,
            expectedReturnDate: null,
          },
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
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
            },
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: `Failed to update product (${error.code}).`,
          meta: error.meta ?? null,
        },
        { status: 500 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
