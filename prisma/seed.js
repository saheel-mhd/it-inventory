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

async function main() {
  await prisma.category.createMany({
    data: CATEGORY_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.assetType.createMany({
    data: ASSET_TYPE_NAMES.map((name) => ({ name })),
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
