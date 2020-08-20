import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Retrieve all users
  const allUsers = await prisma.users.findMany({
    include: {
      avatar: {
        include: {
          file: true,
        },
        where: {
          related_type: "users-permissions_user",
          order: 1,
        },
      },
    },
  });
  console.log(`Retrieved all users: `, allUsers);

  const allListing = await prisma.listings.findMany({
    include: {
      images: {
        include: {
          file: true,
        },
        where: {
          related_type: "listings",
          order: 1,
        },
      },
    },
    where: {
      isPublished: true,
    },
  });
  console.log(`Retrieved all listings: `, allListing);

  // const allUsersMorph = await prisma.upload_file_morph.findMany({
  //   where: { related_type: "users-permissions_user" },
  //   include: { users: true },
  // });
  // console.log(`Retrieved all published posts: `, allUsersMorph);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
