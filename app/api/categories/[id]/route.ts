import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
  assetTypeId?: string;
  prefix?: string;
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Payload;

  const data: { name?: string; assetTypeId?: string; prefix?: string | null; isActive?: boolean } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    data.name = name;
  }

  if (typeof body.assetTypeId === "string") {
    const assetTypeId = body.assetTypeId.trim();
    if (!assetTypeId) {
      return NextResponse.json({ error: "Asset type is required." }, { status: 400 });
    }
    const exists = await prisma.assetType.findUnique({ where: { id: assetTypeId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Selected asset type is invalid." }, { status: 400 });
    }
    data.assetTypeId = assetTypeId;
  }

  if (typeof body.prefix === "string") {
    data.prefix = body.prefix.trim() || null;
  }

  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        prefix: true,
        isActive: true,
        assetType: { select: { name: true } },
      },
    });
    return NextResponse.json(
      {
        category: {
          id: category.id,
          name: category.name,
          prefix: category.prefix,
          isActive: category.isActive,
          assetTypeName: category.assetType?.name ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Category already exists." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Category not found." }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}
