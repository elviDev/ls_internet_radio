import { type NextRequest, NextResponse } from "next/server"
import { getCurrentSession, invalidateUser } from "@/lib/auth"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"
import { put, del } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Get current user to check if they already have a profile picture
    const user = await User.findById(session.id).lean()

    // Generate a unique filename
    const filename = `profile-pictures/${session.id}/${nanoid()}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Delete old profile picture if exists
    if (user?.profilePicture) {
      try {
        // Extract the pathname from the URL
        const url = new URL(user.profilePicture)
        const pathname = url.pathname.substring(1) // Remove leading slash

        await del(pathname)
      } catch (error) {
        console.error("Error deleting old profile picture:", error)
        // Continue even if deletion fails
      }
    }

    // Update user profile with new picture URL
    const updatedUser = await User.findByIdAndUpdate(session.id, { profilePicture: blob.url }, { new: true }).lean()

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
    console.error("Profile picture upload error:", error)
    return NextResponse.json({ error: "An error occurred while uploading profile picture" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await dbConnect()

    // Get current user
    const user = await User.findById(session.id).lean()

    if (!user?.profilePicture) {
      return NextResponse.json({ error: "No profile picture to delete" }, { status: 400 })
    }

    // Delete from Vercel Blob
    try {
      // Extract the pathname from the URL
      const url = new URL(user.profilePicture)
      const pathname = url.pathname.substring(1) // Remove leading slash

      await del(pathname)
    } catch (error) {
      console.error("Error deleting profile picture from blob storage:", error)
      // Continue even if deletion fails
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(session.id, { profilePicture: null }, { new: true }).lean()

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
    console.error("Profile picture delete error:", error)
    return NextResponse.json({ error: "An error occurred while deleting profile picture" }, { status: 500 })
  }
}
