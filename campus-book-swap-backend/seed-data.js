const fs = require("fs");
const path = require("path");

async function seedData() {
  // Read seed data from a JSON file
  const seedData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "seed-data.json"), "utf8")
  );

  // Seed categories
  for (const category of seedData.categories) {
    await strapi.entityService.create("api::category.category", {
      data: category,
    });
  }

  // Seed other content types
  // ...

  console.log("Data seeding completed successfully");
}

module.exports = seedData;
