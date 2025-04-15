import { prisma } from "./prisma";
import { hashPassword } from "./auth/authUtils";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");

    // Check if we have any users
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log("No users found. Creating sample user...");

      // Create a sample admin user
      const hashedPassword = await hashPassword("password123");

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

      console.log("Sample user created successfully!");
    }

    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}
