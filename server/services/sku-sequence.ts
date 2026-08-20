import { prisma } from "~/lib/prisma";

const suffixOf = (sku: string, prefix: string) => {
  const match = sku.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
  if (!match) return null;
  const value = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(value) ? value : null;
};

export const normalizePrefix = (prefix: string) =>
  prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export const formatSku = (prefix: string, value: number) =>
  `${prefix}-${String(value).padStart(2, "0")}`;

export async function allocateSkus(
  rawPrefix: string,
  count: number,
): Promise<string[]> {
  const prefix = normalizePrefix(rawPrefix);
  if (!prefix) throw new Error("This category has no SKU prefix set.");
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Quantity must be a whole number of 1 or more.");
  }

  const existing = await prisma.product.findMany({
    where: { sku: { startsWith: `${prefix}-`, mode: "insensitive" } },
    select: { sku: true },
  });
  let highest = 0;
  for (const { sku } of existing) {
    const value = suffixOf(sku, prefix);
    if (value != null && value > highest) highest = value;
  }
  const floor = highest + 1;

  const rows = await prisma.$queryRaw<{ next: number }[]>`
    INSERT INTO "SkuSequence" ("prefix", "next", "updatedAt")
    VALUES (${prefix}, ${floor + count}, now())
    ON CONFLICT ("prefix") DO UPDATE
      SET "next" = GREATEST("SkuSequence"."next", ${floor}) + ${count},
          "updatedAt" = now()
    RETURNING "next"
  `;

  const after = Number(rows[0]?.next);
  if (!Number.isFinite(after)) throw new Error("Could not reserve SKUs.");

  const start = after - count;
  return Array.from({ length: count }, (_, i) => formatSku(prefix, start + i));
}

export async function peekNextSku(rawPrefix: string): Promise<string | null> {
  const prefix = normalizePrefix(rawPrefix);
  if (!prefix) return null;

  const [sequence, existing] = await Promise.all([
    prisma.skuSequence.findUnique({ where: { prefix }, select: { next: true } }),
    prisma.product.findMany({
      where: { sku: { startsWith: `${prefix}-`, mode: "insensitive" } },
      select: { sku: true },
    }),
  ]);

  let highest = 0;
  for (const { sku } of existing) {
    const value = suffixOf(sku, prefix);
    if (value != null && value > highest) highest = value;
  }

  return formatSku(prefix, Math.max(sequence?.next ?? 1, highest + 1));
}
