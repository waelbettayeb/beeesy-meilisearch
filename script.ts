import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Retrieve all published posts
  const allPosts = await prisma.users_permissions_user.findMany({
    where: { published: true },
  });
  console.log(`Retrieved all published posts: `, allPosts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.disconnect();
  });
