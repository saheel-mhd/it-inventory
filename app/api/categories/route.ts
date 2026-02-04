import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma } from "@prisma/client";

type Payload = {
  name?: string;
  assetTypeId?: string;
  prefix?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();
  const assetTypeId = body.assetTypeId?.trim();
  const prefix = body.prefix?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }
  if (!assetTypeId) {
    return NextResponse.json({ error: "Asset type is required." }, { status: 400 });
  }

  const assetType = await prisma.assetType.findUnique({
    where: { id: assetTypeId },
    select: { id: true, name: true },
  });
  if (!assetType) {
    return NextResponse.json({ error: "Selected asset type is invalid." }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name, assetTypeId, prefix },
      select: { id: true, name: true, prefix: true, isActive: true, assetType: { select: { name: true } } },
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
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
