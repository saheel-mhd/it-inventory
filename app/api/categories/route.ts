import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma } from "@prisma/client";

type Payload = {
  name?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}

