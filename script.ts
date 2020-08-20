import { PrismaClient } from "@prisma/client";
import MeiliSearch from "meilisearch";

const prisma = new PrismaClient();
const client = new MeiliSearch({ host: "http://127.0.0.1:7700" });

async function main() {
  // Retrieve all users
  const allUsers = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      bio: true,
      gender: true,
      dateOfBirth: true,
      avatar: {
        where: {
          related_type: "users-permissions_user",
          order: 1,
        },
        select: {
          file: {
            select: {
              url: true,
            },
          },
        },
      },
    },
    where: {
      confirmed: true,
    },
  });
  console.log(`Retrieved all users: `, allUsers);

  const allListing = await prisma.listings.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      created_at: true,
      updated_at: true,
      listings_components: {
        select: {
          location: { select: { latitude: true, longitude: true } },
        },
        where: {
          component_type: "components_location_geo_coordinates",
        },
      },
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      images: {
        select: {
          file: {
            select: {
              url: true,
            },
          },
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
  const peopleIndex = await client.getOrCreateIndex("people");

  peopleIndex.addDocuments(allUsers as any);
  peopleIndex.resetSearchableAttributes();
  peopleIndex.updateSearchableAttributes([
    "email",
    "firstName",
    "lastName",
    "bio",
    "gender",
  ]);
  const listingsIndex = await client.getOrCreateIndex("listings");

  listingsIndex.addDocuments(allListing as any);
  listingsIndex.resetSearchableAttributes();
  listingsIndex.updateSearchableAttributes([
    "title",
    "description",
    "owner",
    "created_at",
    "updated_at",
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
