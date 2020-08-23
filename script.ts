import { PrismaClient } from "@prisma/client";
import MeiliSearch from "meilisearch";
import * as dotenv from "dotenv";
dotenv.config();

var schedule = require("node-schedule");
var prisma: PrismaClient;
console.log("Data fetcher started!");
console.log(`MeiliSearch endpoint: ${process.env.SEARCH_ENDPOINT}`);

async function main() {
  prisma = new PrismaClient();
  const client = new MeiliSearch({
    host: `${process.env.SEARCH_ENDPOINT}`,
    apiKey: `${process.env.SEARCH_KEY}`,
  });
  client.getKeys();
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
  const listings = allListing.map((r) => {
    const { listings_components, ...rest } = {
      ...r,
      ...r.listings_components[0]?.location,
    };
    return rest;
  });
  console.log(`Retrieved all listings: `, listings);
  // await (await client.getOrCreateIndex("people")).deleteAllDocuments();
  // await (await client.getOrCreateIndex("listings")).deleteAllDocuments();
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
  listingsIndex.addDocuments(listings as any);
  listingsIndex.resetSearchableAttributes();
  listingsIndex.updateStopWords(["id", "email", "firstName", "lastName"]);
  listingsIndex.updateSearchableAttributes([
    "title",
    "description",
    "owner",
    "created_at",
    "updated_at",
  ]);
}

var j = schedule.scheduleJob("* * * * *", function () {
  console.log("----------------------------");
  console.log("Scheduled fetching started!");
  main()
    .catch((e) => {
      console.error(e);
    })
    .finally(async () => {
      console.log("Scheduled fetching Finished!");
      console.log("----------------------------");
      await prisma.$disconnect();
    });
});
