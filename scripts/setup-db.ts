import dbConnect from "../lib/mongoose"
import User from "../models/User"
import { hashPassword } from "../lib/auth"

async function setupDatabase() {
  try {
    console.log("Connecting to MongoDB...")
    await dbConnect()
    console.log("Connected successfully!")

    // Check if we have any users
    const userCount = await User.countDocuments()
    console.log(`Found ${userCount} existing users`)

    if (userCount === 0) {
      console.log("Creating admin user...")

      // Create admin user with password "admin123" (you should change this)
      const hashedPassword = await hashPassword("admin123")

      await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      })

      console.log("Admin user created successfully!")
    }

    console.log("Database setup completed!")
  } catch (error) {
    console.error("Database setup failed:", error)
  } finally {
    // Close the connection
    process.exit(0)
  }
}

setupDatabase()
