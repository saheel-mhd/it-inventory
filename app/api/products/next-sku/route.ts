import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

const getNextNumber = (skus: string[], prefix: string) => {
  let max = 0;
  const strictPattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const loosePattern = /(\d+)\s*$/;

  for (const sku of skus) {
    const strictMatch = sku.match(strictPattern);
    if (strictMatch) {
      max = Math.max(max, Number.parseInt(strictMatch[1] ?? "0", 10));
      continue;
    }
    if (sku.toUpperCase().startsWith(`${prefix.toUpperCase()}-`)) {
      const looseMatch = sku.match(loosePattern);
      if (looseMatch) {
        max = Math.max(max, Number.parseInt(looseMatch[1] ?? "0", 10));
      }
    }
  }

  return max + 1;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId")?.trim();

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId is required." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, prefix: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const prefix = category.prefix?.trim();
  if (!prefix) {
    return NextResponse.json({ sku: "", prefix: null });
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId,
      sku: { startsWith: `${prefix}-` },
    },
    select: { sku: true },
  });

  const nextNumber = getNextNumber(
    products.map((item) => item.sku),
    prefix,
  );
  const sku = `${prefix}-${String(nextNumber).padStart(2, "0")}`;
  return NextResponse.json({ sku, prefix });
}
