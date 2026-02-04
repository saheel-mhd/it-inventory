require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const CATEGORY_NAMES = [
  "Laptop",
  "Accessories",
  "MiniPC",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Peripherals",
  "Cable",
  "Storage",
  "Communication",
];

const ASSET_TYPE_NAMES = ["Fixed Asset", "Accessory", "Consumables"];
const DEPARTMENTS = [
  { code: "IT", name: "IT" },
  { code: "FINANCE", name: "Finance" },
  { code: "HR", name: "HR" },
  { code: "OPERATIONS", name: "Operations" },
  { code: "SALES", name: "Sales" },
];
const WARRANTY_PERIODS = [
  { code: "THREE_MONTHS", name: "3 months", months: 3 },
  { code: "SIX_MONTHS", name: "6 months", months: 6 },
  { code: "ONE_YEAR", name: "1 year", months: 12 },
];

async function main() {
  await prisma.category.createMany({
    data: CATEGORY_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.assetType.createMany({
    data: ASSET_TYPE_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.departmentModel.createMany({
    data: DEPARTMENTS,
    skipDuplicates: true,
  });

  await prisma.warrantyPeriodModel.createMany({
    data: WARRANTY_PERIODS,
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
