import bwipjs from "bwip-js/node";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { withApiSession } from "~/server/middleware/auth";

type Params = { params: Promise<{ id: string }> };

async function handler(_request: Request, { params }: Params) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { sku: true, product: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(_request.url);
  const format = url.searchParams.get("format") === "qr" ? "qrcode" : "code128";

  const png = await bwipjs.toBuffer({
    bcid: format,
    text: product.sku,
    scale: 3,
    height: format === "code128" ? 12 : undefined,
    includetext: format === "code128",
    textxalign: "center",
  });

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export const GET = withApiSession(handler);
