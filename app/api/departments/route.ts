import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
};

const normalizeCode = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "DEPARTMENT";

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Department name is required." }, { status: 400 });
  }

  try {
    const department = await prisma.departmentModel.create({
      data: { name, code: normalizeCode(name) },
      select: { id: true, name: true, code: true, isActive: true },
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Department already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create department." }, { status: 500 });
  }
}
