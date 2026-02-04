import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Asset type name is required." }, { status: 400 });
  }

  try {
    const assetType = await prisma.assetType.create({
      data: { name },
      select: { id: true, name: true, isActive: true },
    });
    return NextResponse.json({ assetType }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Asset type already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create asset type." }, { status: 500 });
  }
}
