import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  conflict,
  notFound,
  parseJson,
  RouteContext,
  serverError,
} from "~/server/middleware/route";
import {
  createActorCreateFields,
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

type LocationPayload = {
  code?: string;
  name?: string;
  address?: string | null;
  isActive?: boolean;
};

export async function listLocations() {
  const items = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function createLocation(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<LocationPayload>(request);
  const code = body.code?.trim().toUpperCase();
  const name = body.name?.trim();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    const location = await prisma.location.create({
      data: {
        code,
        name,
        address: body.address ?? null,
        ...createActorCreateFields(actor),
      },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "LOCATION_CREATED",
      entityType: "Location",
      entityId: location.id,
      summary: `Created location "${location.name}".`,
    });
    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return conflict({ error: "A location with that code or name already exists." });
    }
    return serverError({ error: "Failed to create location." });
  }
}

export async function updateLocation(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<LocationPayload>(request);
  const data: Prisma.LocationUpdateInput = {};

  if (typeof body.code === "string") {
    const code = body.code.trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });
    data.code = code;
  }
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    data.name = name;
  }
  if (body.address !== undefined) data.address = body.address ?? null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const location = await prisma.location.update({
      where: { id },
      data: { ...data, ...createActorUpdateFields(actor) },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "LOCATION_UPDATED",
      entityType: "Location",
      entityId: location.id,
      summary: `Updated location "${location.name}".`,
    });
    return NextResponse.json({ location });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        return conflict({ error: "A location with that code or name already exists." });
      if (error.code === "P2025") return notFound({ error: "Location not found." });
    }
    return serverError({ error: "Failed to update location." });
  }
}
