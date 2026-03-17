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

type WarrantyPeriodPayload = {
  name?: string;
  months?: number;
  isActive?: boolean;
};

const normalizeCode = (name: string, months: number) =>
  `${name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18)}_${months}` || `WARRANTY_${months}`;

export async function createWarrantyPeriod(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<WarrantyPeriodPayload>(request);
  const name = body.name?.trim();
  const months = Number(body.months);

  if (!name) {
    return NextResponse.json({ error: "Warranty name is required." }, { status: 400 });
  }
  if (!Number.isFinite(months) || months <= 0 || !Number.isInteger(months)) {
    return NextResponse.json(
      { error: "Months must be a positive whole number." },
      { status: 400 },
    );
  }

  try {
    const warrantyPeriod = await prisma.warrantyPeriodModel.create({
      data: {
        name,
        months,
        code: normalizeCode(name, months),
        ...createActorCreateFields(actor),
      },
      select: { id: true, name: true, months: true, code: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "WARRANTY_PERIOD_CREATED",
      entityType: "WarrantyPeriod",
      entityId: warrantyPeriod.id,
      summary: `Created warranty period "${warrantyPeriod.name}".`,
    });
    return NextResponse.json({ warrantyPeriod }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Warranty period already exists." }, { status: 409 });
    }
    return serverError({ error: "Failed to create warranty period." });
  }
}

export async function updateWarrantyPeriod(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<WarrantyPeriodPayload>(request);

  const current = await prisma.warrantyPeriodModel.findUnique({
    where: { id },
    select: { id: true, name: true, months: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Warranty period not found." }, { status: 404 });
  }

  const data: { name?: string; months?: number; code?: string; isActive?: boolean } = {};
  const nextName =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : current.name;
  const rawMonths = typeof body.months === "number" ? body.months : Number.NaN;
  const nextMonths = Number.isFinite(rawMonths) ? rawMonths : current.months;

  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Warranty name is required." }, { status: 400 });
    }
    data.name = nextName;
  }

  if (typeof body.months === "number") {
    if (!Number.isInteger(body.months) || body.months <= 0) {
      return NextResponse.json(
        { error: "Months must be a positive whole number." },
        { status: 400 },
      );
    }
    data.months = body.months;
  }

  if (typeof body.name === "string" || typeof body.months === "number") {
    data.code = normalizeCode(nextName, nextMonths);
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const warrantyPeriod = await prisma.warrantyPeriodModel.update({
      where: { id },
      data: { ...data, ...createActorUpdateFields(actor) },
      select: { id: true, name: true, months: true, code: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action:
        typeof body.isActive === "boolean"
          ? body.isActive
            ? "WARRANTY_PERIOD_ACTIVATED"
            : "WARRANTY_PERIOD_DEACTIVATED"
          : "WARRANTY_PERIOD_UPDATED",
      entityType: "WarrantyPeriod",
      entityId: warrantyPeriod.id,
      summary: `Updated warranty period "${warrantyPeriod.name}".`,
      metadata: { isActive: warrantyPeriod.isActive },
    });
    return NextResponse.json({ warrantyPeriod }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Warranty period already exists." }, { status: 409 });
    }
    return serverError({ error: "Failed to update warranty period." });
  }
}
