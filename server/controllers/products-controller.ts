import { Prisma, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  getNextSkuNumber,
  parseCostValue,
  parseOptionalDateValue,
  ProductPayload,
  serializeProducts,
} from "~/server/services/product-utils";
import { parseJson, serverError } from "~/server/middleware/route";
import {
  createActorCreateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

export async function createProduct(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<ProductPayload>(request);
  const errors: Record<string, string> = {};

  if (!body.product?.trim()) errors.product = "Product name is required.";
  if (!body.sku?.trim()) errors.sku = "SKU is required.";
  if (!body.categoryId) errors.categoryId = "Category is required.";
  if (!body.assetTypeId) errors.assetTypeId = "Asset type is required.";

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

  try {
    const product = await prisma.product.create({
      data: {
        product: body.product!.trim(),
        brand: body.brand?.trim() || "N/A",
        sku: body.sku!.trim(),
        snNumber: body.snNumber?.trim() || null,
        specification: body.specification?.trim() || null,
        orderedDate: orderedDate.value,
        cost: cost.value,
        warrantyPeriodId: body.warrantyPeriodId || null,
        warrantyExpire: warrantyExpire.value,
        categoryId: body.categoryId!,
        assetTypeId: body.assetTypeId!,
        ...createActorCreateFields(actor),
      },
    });

    await writeAuditLog(prisma, {
      actor,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      summary: `Created product "${body.product!.trim()}".`,
      metadata: { sku: body.sku!.trim() },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Create product failed", error);

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
        error: `Failed to create product (${error.code}).`,
        meta: error.meta ?? null,
      });
    }

    if (error instanceof Error) {
      return serverError({ error: error.message });
    }

    return serverError({ error: "Failed to create product." });
  }
}

export async function listProducts(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const statusRaw = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "updated_desc";

  const orderBy =
    sort === "updated_asc"
      ? ({ updatedAt: "asc" } as const)
      : ({ updatedAt: "desc" } as const);

  const status = Object.values(ProductStatus).includes(statusRaw as ProductStatus)
    ? (statusRaw as ProductStatus)
    : null;

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { product: { contains: q, mode: "insensitive" as const } },
              { assignedTo: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
              { snNumber: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy,
    include: {
      category: true,
      assetType: true,
      warrantyPeriod: true,
      staffAssignments: {
        where: { returnDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        include: { staff: true },
      },
    },
  });

  return NextResponse.json({ products: serializeProducts(products) });
}

export async function getNextSku(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId")?.trim();

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId is required." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, prefix: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const prefix = category.prefix?.trim();
  if (!prefix) {
    return NextResponse.json({ sku: "", prefix: null });
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId,
      sku: { startsWith: `${prefix}-` },
    },
    select: { sku: true },
  });

  const nextNumber = getNextSkuNumber(
    products.map((item) => item.sku),
    prefix,
  );
  return NextResponse.json({
    sku: `${prefix}-${String(nextNumber).padStart(2, "0")}`,
    prefix,
  });
}
