import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Payload = {
  name?: string;
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Payload;

  const data: { name?: string; isActive?: boolean } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Asset type name is required." }, { status: 400 });
    data.name = name;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const assetType = await prisma.assetType.update({
      where: { id },
      data,
      select: { id: true, name: true, isActive: true },
    });
    return NextResponse.json({ assetType }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Asset type already exists." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Asset type not found." }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Failed to update asset type." }, { status: 500 });
  }
}
