const { prisma } = require("./lib/prisma");

async function main() {
  const users = await prisma.user.findMany();
  console.log("DB connected! Users:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());