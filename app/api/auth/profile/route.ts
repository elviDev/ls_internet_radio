import { type NextRequest, NextResponse } from "next/server"
import { getCurrentSession, verifyPassword, hashPassword, invalidateUser } from "@/lib/auth"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, currentPassword } = await req.json()

    // Connect to database
    await dbConnect()

    // Get the current user
    const user = await User.findById(session.id).lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email }).lean()

      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }

      updateData.email = email
    }

    // Update password if provided
    if (password && currentPassword) {
      // Verify current password
      const isPasswordValid = await verifyPassword(currentPassword, user.password)

      if (!isPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      // Hash new password
      updateData.password = await hashPassword(password)
    }

    // If no updates, return success
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      })
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(session.id, updateData, { new: true }).lean()

    // Invalidate user cache
    await invalidateUser(session.id)

    return NextResponse.json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "An error occurred while updating profile" }, { status: 500 })
  }
}
