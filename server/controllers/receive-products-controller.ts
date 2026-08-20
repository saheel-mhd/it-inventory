import { Prisma, ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import { parseJson, serverError } from "~/server/middleware/route";
import { createActorCreateFields, writeAuditLog } from "~/server/services/audit-log";
import { allocateSkus, normalizePrefix } from "~/server/services/sku-sequence";

/*
 * Receiving a purchase.
 *
 * A delivery is one entry with a line per thing bought: five laptops on one
 * line, five mice on the next. Detail shared by a line is given once; the only
 * per-unit field is the serial number, and only for things that carry one.
 *
 * Categories with a SKU prefix are labelled individually, so five mice become
 * five assets (MOU-06..MOU-10) that can go to five different people. Categories
 * without a prefix are bulk stock and stay one record with a count — right for
 * cables nobody tags.
 *
 * The whole entry is written in one transaction: a delivery is recorded
 * completely or not at all, never half.
 */

type ReceiveLine = {
  categoryId?: string;
  assetTypeId?: string;
  productName?: string;
  brand?: string;
  quantity?: number;
  serialNumbers?: string[];
  specification?: string | null;
  cost?: number | null;
  warrantyPeriodId?: string | null;
  warrantyExpire?: string | null;
  departmentId?: string | null;
};

type ReceivePayload = {
  orderedDate?: string | null;
  lines?: ReceiveLine[];
};

const MAX_UNITS_PER_LINE = 200;
const MAX_LINES = 50;

const parseDateOrNull = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function receiveProducts(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return fail("Not authenticated.", 401);

  const body = await parseJson<ReceivePayload>(request);
  const lines = body.lines ?? [];

  if (lines.length === 0) return fail("Add at least one item to receive.");
  if (lines.length > MAX_LINES) {
    return fail(`Receive at most ${MAX_LINES} lines at a time.`);
  }

  const orderedDate = parseDateOrNull(body.orderedDate);
  if (orderedDate === undefined) return fail("Purchase date is invalid.");

  type PreparedLine = {
    line: ReceiveLine;
    label: string;
    categoryId: string;
    assetTypeId: string;
    prefix: string;
    isTagged: boolean;
    quantity: number;
    serials: string[];
    warrantyExpire: Date | null;
  };

  // Everything is validated before a single tag is reserved, so a rejected entry
  // never burns numbers out of the sequence.
  const prepared: PreparedLine[] = [];
  const serialsAcrossEntry = new Set<string>();

  for (const [index, line] of lines.entries()) {
    const position = `Line ${index + 1}`;
    const productName = line.productName?.trim();
    const quantity = Number(line.quantity);

    if (!line.categoryId) return fail(`${position}: choose a category.`);
    if (!productName) return fail(`${position}: enter a product name.`);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return fail(`${position}: quantity must be a whole number of 1 or more.`);
    }
    if (quantity > MAX_UNITS_PER_LINE) {
      return fail(`${position}: receive at most ${MAX_UNITS_PER_LINE} units per line.`);
    }

    const category = await prisma.category.findUnique({
      where: { id: line.categoryId },
      select: { id: true, name: true, prefix: true, assetTypeId: true },
    });
    if (!category) return fail(`${position}: category not found.`);

    const assetTypeId = line.assetTypeId ?? category.assetTypeId;
    if (!assetTypeId) {
      return fail(
        `${position}: "${category.name}" has no asset type. Set one on the category first.`,
      );
    }

    const warrantyExpire = parseDateOrNull(line.warrantyExpire);
    if (warrantyExpire === undefined) {
      return fail(`${position}: warranty expiry is invalid.`);
    }

    const serials = (line.serialNumbers ?? [])
      .map((value) => (value ?? "").trim())
      .map((value) => (value === "-" ? "" : value));
    const provided = serials.filter(Boolean);

    if (provided.length > quantity) {
      return fail(
        `${position}: ${provided.length} serial numbers given for ${quantity} units.`,
      );
    }
    for (const serial of provided) {
      const key = serial.toLowerCase();
      if (serialsAcrossEntry.has(key)) {
        return fail(`${position}: serial number "${serial}" appears twice in this entry.`);
      }
      serialsAcrossEntry.add(key);
    }

    prepared.push({
      line,
      label: position,
      categoryId: category.id,
      assetTypeId,
      prefix: category.prefix?.trim() || normalizePrefix(category.name),
      isTagged: Boolean(category.prefix?.trim()),
      quantity,
      serials,
      warrantyExpire,
    });
  }

  if (serialsAcrossEntry.size > 0) {
    const clash = await prisma.product.findFirst({
      where: { snNumber: { in: [...serialsAcrossEntry], mode: "insensitive" } },
      select: { snNumber: true, sku: true },
    });
    if (clash) {
      return fail(
        `Serial number "${clash.snNumber}" is already recorded on ${clash.sku}.`,
        409,
      );
    }
  }

  try {
    const creates: Prisma.ProductCreateArgs[] = [];
    const perLine: { label: string; product: string; skus: string[] }[] = [];

    for (const item of prepared) {
      const unitCount = item.isTagged ? item.quantity : 1;
      let skus: string[];
      try {
        skus = await allocateSkus(item.prefix, unitCount);
      } catch (error) {
        return fail(
          `${item.label}: ${
            error instanceof Error ? error.message : "could not allocate SKUs."
          }`,
        );
      }

      const shared = {
        product: item.line.productName!.trim(),
        brand: item.line.brand?.trim() || "General",
        specification: item.line.specification?.trim() || null,
        categoryId: item.categoryId,
        assetTypeId: item.assetTypeId,
        departmentId: item.line.departmentId || null,
        warrantyPeriodId: item.line.warrantyPeriodId || null,
        orderedDate,
        warrantyExpire: item.warrantyExpire,
        cost: item.line.cost == null ? null : new Prisma.Decimal(item.line.cost),
        status: ProductStatus.AVAILABLE,
      };

      skus.forEach((sku, unitIndex) => {
        creates.push({
          data: {
            ...shared,
            sku,
            snNumber: item.isTagged ? item.serials[unitIndex] || null : null,
            quantity: item.isTagged ? 1 : item.quantity,
            ...createActorCreateFields(actor),
          },
        });
      });

      perLine.push({ label: item.label, product: shared.product, skus });
    }

    await prisma.$transaction(creates.map((args) => prisma.product.create(args)));

    const totalUnits = prepared.reduce((sum, item) => sum + item.quantity, 0);
    await writeAuditLog(prisma, {
      actor,
      action: "PRODUCTS_RECEIVED",
      entityType: "Product",
      summary: `Received ${totalUnits} units across ${prepared.length} lines.`,
      metadata: { lines: perLine, totalUnits },
    });

    return NextResponse.json(
      { totalUnits, assetsCreated: creates.length, lines: perLine },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That SKU or serial number is already in use. Please try again.", 409);
    }
    return serverError({ error: "Failed to record this purchase." });
  }
}
