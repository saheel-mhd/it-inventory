import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma } from "@prisma/client";

type Payload = {
  product?: string;
  brand?: string;
  snNumber?: string;
  sku?: string;
  specification?: string;
  orderedDate?: string;
  cost?: string;
  warranty?: "THREE_MONTHS" | "SIX_MONTHS" | "ONE_YEAR";
  warrantyExpire?: string;
  categoryId?: string;
  assetTypeId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const errors: Record<string, string> = {};

  if (!body.product?.trim()) errors.product = "Product name is required.";
  if (!body.brand?.trim()) errors.brand = "Brand is required.";
  if (!body.sku?.trim()) errors.sku = "SKU is required.";
  if (!body.categoryId) errors.categoryId = "Category is required.";
  if (!body.assetTypeId) errors.assetTypeId = "Asset type is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const warrantyValue =
    body.warranty && body.warranty.length > 0 ? body.warranty : null;

  try {
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

    await prisma.product.create({
      data: {
        product: body.product!.trim(),
        brand: body.brand!.trim(),
        sku: body.sku!.trim(),
        snNumber: body.snNumber?.trim() || null,
        specification: body.specification?.trim() || null,
        orderedDate,
        cost,
        warranty: warrantyValue,
        warrantyExpire,
        categoryId: body.categoryId!,
        assetTypeId: body.assetTypeId!,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: unknown) {
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
            },
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: `Failed to create product (${error.code}).`,
          meta: error.meta ?? null,
        },
        { status: 500 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "updated_desc";

  const orderBy =
    sort === "updated_asc" ? { updatedAt: "asc" } : { updatedAt: "desc" };

  const where = {
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
  };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: true,
      assetType: true,
      staffAssignments: {
        where: { returnDate: null },
        orderBy: { startDate: "desc" },
        take: 1,
        include: { staff: true },
      },
    },
  });

  const serialized = products
    .map((product) => {
      const { staffAssignments, ...rest } = product;
      const latestAssignment = staffAssignments[0];
      const assignedName =
        rest.assignedTo ?? latestAssignment?.staff?.name ?? null;
      const status =
        assignedName && rest.status === "AVAILABLE" ? "ACTIVE_USE" : rest.status;

      return {
        ...rest,
        assignedTo: assignedName,
        status,
      };
    })
    .map((product) => ({
      ...product,
      cost: product.cost ? product.cost.toString() : null,
      orderedDate: product.orderedDate ? product.orderedDate.toISOString() : null,
      warrantyExpire: product.warrantyExpire
        ? product.warrantyExpire.toISOString()
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

  return NextResponse.json({ products: serialized });
}
