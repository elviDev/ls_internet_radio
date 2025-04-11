import dbConnect from "../lib/mongoose"
import User from "../models/User"

async function main() {
  try {
    console.log("Testing database connection...")

    // Connect to database
    await dbConnect()

    // Try to query the database
    const userCount = await User.countDocuments()
    console.log(`Database has ${userCount} users`)

    console.log("Database test completed successfully.")
  } catch (error) {
    console.error("Database connection test failed:", error)
  }
}

main()
