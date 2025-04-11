import { prisma } from "../lib/prisma";

async function main() {
  try {
    console.log("Testing database connection with Prisma...");

    // Try to query the database
    const userCount = await prisma.user.count();
    console.log(`Database has ${userCount} users`);

    console.log("Database test completed successfully.");
  } catch (error) {
    console.error("Database connection test failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
