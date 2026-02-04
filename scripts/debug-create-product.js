require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const category = await prisma.category.findFirst({ orderBy: { name: "asc" } });
  const assetType = await prisma.assetType.findFirst({ orderBy: { name: "asc" } });
  const warrantyPeriod = await prisma.warrantyPeriodModel.findFirst({
    where: { code: "THREE_MONTHS" },
  });
  if (!category) throw new Error("No categories found");
  if (!assetType) throw new Error("No asset types found");
  if (!warrantyPeriod) throw new Error("No warranty periods found");

  const data = {
    product: "Debug Product",
    brand: "Debug Brand",
    sku: `DBG-${Date.now()}`,
    specification: null,
    orderedDate: new Date("2026-02-03"),
    cost: "10.50",
    warrantyPeriodId: warrantyPeriod.id,
    warrantyExpire: new Date("2026-05-03"),
    categoryId: category.id,
    assetTypeId: assetType.id,
  };

  const created = await prisma.product.create({ data });
  console.log("Created product id:", created.id);

  await prisma.product.delete({ where: { id: created.id } });
  console.log("Deleted product id:", created.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
