import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { Prisma } from "@prisma/client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "There is a product in this category, can't delete category now." },
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Category not found." }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}

