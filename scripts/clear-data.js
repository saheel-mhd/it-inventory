require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (process.env.NODE_ENV === "production") {
  console.error("clear-data.js refuses to run with NODE_ENV=production.");
  process.exit(1);
}

if (!process.argv.includes("--yes-i-know-this-deletes-data")) {
  console.error(
    "clear-data.js wipes Product, Staff, and StaffInventory rows.\n" +
      "Re-run with --yes-i-know-this-deletes-data to confirm.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.staffInventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.staff.deleteMany({});
  console.log("Cleared StaffInventory, Product, Staff");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
