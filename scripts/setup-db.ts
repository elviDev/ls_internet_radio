import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/authUtils";

async function setupDatabase() {
  try {
    console.log("Connecting to MongoDB with Prisma...");

    // Check if we have any users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} existing users`);

    if (userCount === 0) {
      console.log("Creating admin user...");

      // Create admin user with password "admin123" (you should change this)
      const hashedPassword = await hashPassword("admin123");

      const admin = await prisma.user.create({
        data: {
          name: "Admin User",
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
        },
      });

      // Create user data for admin
      await prisma.userData.create({
        data: {
          userId: admin.id,
        },
      });

      console.log("Admin user created successfully!");
    }

    console.log("Database setup completed!");
  } catch (error) {
    console.error("Database setup failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

setupDatabase();
