import dbConnect from "./mongoose"
import User from "@/models/User"

export async function initializeDatabase() {
  try {
    // Connect to database
    await dbConnect()

    // Check if we have any users
    const userCount = await User.countDocuments()

    if (userCount === 0) {
      console.log("No users found. Creating sample user...")

      // Create a sample admin user
      await User.create({
        name: "Admin User",
        email: "admin@example.com",
        // Password: "password123" (hashed)
        password: "$2a$12$k8Y1THPD8KDNPAYo1Lh.Yuh3Yp7Kl0xvRxXlzPwXCvLdFIFVNKCey",
        role: "admin",
      })

      console.log("Sample user created successfully!")
    }

    console.log("Database initialization completed.")
  } catch (error) {
    console.error("Database initialization failed:", error)
  }
}
