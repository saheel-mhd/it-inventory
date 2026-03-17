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

type CategoryPayload = {
  name?: string;
  assetTypeId?: string;
  prefix?: string;
  isActive?: boolean;
};

const invalidAssetType = () =>
  NextResponse.json({ error: "Selected asset type is invalid." }, { status: 400 });

const serializeCategory = (category: {
  id: string;
  name: string;
  prefix: string | null;
  isActive: boolean;
  assetType: { name: string } | null;
}) => ({
  category: {
    id: category.id,
    name: category.name,
    prefix: category.prefix,
    isActive: category.isActive,
    assetTypeName: category.assetType?.name ?? null,
  },
});

export async function createCategory(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<CategoryPayload>(request);
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
    select: { id: true },
  });
  if (!assetType) return invalidAssetType();

  try {
    const category = await prisma.category.create({
      data: { name, assetTypeId, prefix, ...createActorCreateFields(actor) },
      select: {
        id: true,
        name: true,
        prefix: true,
        isActive: true,
        assetType: { select: { name: true } },
      },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      summary: `Created category "${category.name}".`,
    });
    return NextResponse.json(serializeCategory(category), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category already exists." }, { status: 409 });
    }
    return serverError({ error: "Failed to create category." });
  }
}

export async function updateCategory(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<CategoryPayload>(request);
  const data: {
    name?: string;
    assetTypeId?: string;
    prefix?: string | null;
    isActive?: boolean;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }
    data.name = name;
  }

  if (typeof body.assetTypeId === "string") {
    const assetTypeId = body.assetTypeId.trim();
    if (!assetTypeId) {
      return NextResponse.json({ error: "Asset type is required." }, { status: 400 });
    }
    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId },
      select: { id: true },
    });
    if (!assetType) return invalidAssetType();
    data.assetTypeId = assetTypeId;
  }

  if (typeof body.prefix === "string") {
    data.prefix = body.prefix.trim() || null;
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { ...data, ...createActorUpdateFields(actor) },
      select: {
        id: true,
        name: true,
        prefix: true,
        isActive: true,
        assetType: { select: { name: true } },
      },
    });
    await writeAuditLog(prisma, {
      actor,
      action:
        typeof body.isActive === "boolean"
          ? body.isActive
            ? "CATEGORY_ACTIVATED"
            : "CATEGORY_DEACTIVATED"
          : "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: category.id,
      summary: `Updated category "${category.name}".`,
      metadata: { isActive: category.isActive },
    });
    return NextResponse.json(serializeCategory(category), { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Category already exists." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Category not found." }, { status: 404 });
      }
    }
    return serverError({ error: "Failed to update category." });
  }
}
