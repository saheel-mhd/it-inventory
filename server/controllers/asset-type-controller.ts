import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  conflict,
  parseJson,
  serverError,
  RouteContext,
} from "~/server/middleware/route";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

type AssetTypePayload = {
  name?: string;
  isActive?: boolean;
};

export async function createAssetType(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<AssetTypePayload>(request);
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Asset type name is required." },
      { status: 400 },
    );
  }

  try {
    const assetType = await prisma.assetType.create({
      data: { name, ...createActorCreateFields(actor) },
      select: { id: true, name: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "ASSET_TYPE_CREATED",
      entityType: "AssetType",
      entityId: assetType.id,
      summary: `Created asset type "${assetType.name}".`,
    });
    return NextResponse.json({ assetType }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return conflict({ error: "Asset type already exists." });
    }
    return serverError({ error: "Failed to create asset type." });
  }
}

export async function updateAssetType(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<AssetTypePayload>(request);
  const data: { name?: string; isActive?: boolean } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Asset type name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const assetType = await prisma.assetType.update({
      where: { id },
      data: { ...data, ...createActorUpdateFields(actor) },
      select: { id: true, name: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action:
        typeof body.isActive === "boolean"
          ? body.isActive
            ? "ASSET_TYPE_ACTIVATED"
            : "ASSET_TYPE_DEACTIVATED"
          : "ASSET_TYPE_UPDATED",
      entityType: "AssetType",
      entityId: assetType.id,
      summary: `Updated asset type "${assetType.name}".`,
      metadata: { isActive: assetType.isActive },
    });
    return NextResponse.json({ assetType }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return conflict({ error: "Asset type already exists." });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Asset type not found." }, { status: 404 });
      }
    }
    return serverError({ error: "Failed to update asset type." });
  }
}
