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

type DepartmentPayload = {
  name?: string;
  isActive?: boolean;
};

const normalizeCode = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "DEPARTMENT";

export async function createDepartment(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await parseJson<DepartmentPayload>(request);
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Department name is required." },
      { status: 400 },
    );
  }

  try {
    const department = await prisma.departmentModel.create({
      data: { name, code: normalizeCode(name), ...createActorCreateFields(actor) },
      select: { id: true, name: true, code: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: department.id,
      summary: `Created department "${department.name}".`,
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return conflict({ error: "Department already exists." });
    }
    return serverError({ error: "Failed to create department." });
  }
}

export async function updateDepartment(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await parseJson<DepartmentPayload>(request);
  const data: { name?: string; code?: string; isActive?: boolean } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Department name is required." },
        { status: 400 },
      );
    }
    data.name = name;
    data.code = normalizeCode(name);
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const department = await prisma.departmentModel.update({
      where: { id },
      data: { ...data, ...createActorUpdateFields(actor) },
      select: { id: true, name: true, code: true, isActive: true },
    });
    await writeAuditLog(prisma, {
      actor,
      action:
        typeof body.isActive === "boolean"
          ? body.isActive
            ? "DEPARTMENT_ACTIVATED"
            : "DEPARTMENT_DEACTIVATED"
          : "DEPARTMENT_UPDATED",
      entityType: "Department",
      entityId: department.id,
      summary: `Updated department "${department.name}".`,
      metadata: { isActive: department.isActive },
    });
    return NextResponse.json({ department }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return conflict({ error: "Department already exists." });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Department not found." }, { status: 404 });
      }
    }
    return serverError({ error: "Failed to update department." });
  }
}
