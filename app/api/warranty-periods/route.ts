import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
  months?: number;
};

const normalizeCode = (name: string, months: number) =>
  `${name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18)}_${months}` || `WARRANTY_${months}`;

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();
  const months = Number(body.months);

  if (!name) {
    return NextResponse.json({ error: "Warranty name is required." }, { status: 400 });
  }
  if (!Number.isFinite(months) || months <= 0 || !Number.isInteger(months)) {
    return NextResponse.json({ error: "Months must be a positive whole number." }, { status: 400 });
  }

  try {
    const warrantyPeriod = await prisma.warrantyPeriodModel.create({
      data: {
        name,
        months,
        code: normalizeCode(name, months),
      },
      select: { id: true, name: true, months: true, code: true, isActive: true },
    });
    return NextResponse.json({ warrantyPeriod }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Warranty period already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create warranty period." }, { status: 500 });
  }
}
