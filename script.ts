import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Retrieve all published posts
  const allUsers = await prisma.users.findMany({});
  console.log(`Retrieved all published posts: `, allUsers);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
