// Import required modules
const { spawnSync } = require("child_process");

// Skip the dotenv loading and set environment variable directly
process.env.DATABASE_URL =
  "postgresql://postgres:slantie@localhost:5432/verbose?schema=public";
process.env.EMAIL_USER = "slantiesiphone1@gmail.com";
process.env.EMAIL_PASS = "sxrz imbp leyt jqmk";
process.env.EMAIL_PASSWORD = "sxrz imbp leyt jqmk";

console.log("Set DATABASE_URL:", process.env.DATABASE_URL);
console.log("Set EMAIL_USER:", process.env.EMAIL_USER);
console.log("Set EMAIL_PASS:", process.env.EMAIL_PASS);

// First, generate the Prisma client
console.log("Generating Prisma client...");
const generateResult = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: process.env,
});

if (generateResult.status !== 0) {
  console.error("Failed to generate Prisma client");
  process.exit(generateResult.status);
}

// Then execute the provided Prisma command with the environment variable
const args = process.argv.slice(2);
console.log(`Running prisma ${args.join(" ")}...`);
const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status);
