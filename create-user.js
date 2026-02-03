require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

console.log("DATABASE_URL:", process.env.DATABASE_URL); // keep for now

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});


async function main() {
  const name = process.argv[2];
  const password = process.argv[3];

  if (!name || !password) {
    console.log("Usage: node create-user.js <name> <password>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { name },
    update: { password: hash },
    create: { name, password: hash },
  });

  console.log("User created/updated:", name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
