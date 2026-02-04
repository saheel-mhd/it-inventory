import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Payload;

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
  const rawMonths =
    typeof body.months === "number" ? body.months : Number.NaN;
  const nextMonths = Number.isFinite(rawMonths) ? rawMonths : current.months;

  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Warranty name is required." }, { status: 400 });
    }
    data.name = nextName;
  }

  if (typeof body.months === "number") {
    if (!Number.isInteger(body.months) || body.months <= 0) {
      return NextResponse.json({ error: "Months must be a positive whole number." }, { status: 400 });
    }
    data.months = body.months;
  }

  if (typeof body.name === "string" || typeof body.months === "number") {
    data.code = normalizeCode(nextName, nextMonths);
  }

  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const warrantyPeriod = await prisma.warrantyPeriodModel.update({
      where: { id },
      data,
      select: { id: true, name: true, months: true, code: true, isActive: true },
    });
    return NextResponse.json({ warrantyPeriod }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Warranty period already exists." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Failed to update warranty period." }, { status: 500 });
  }
}
