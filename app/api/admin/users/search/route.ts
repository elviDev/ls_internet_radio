import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// GET /api/admin/users/search - Search for user by email
export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Search in User table first
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      }
    })

    if (user) {
      return NextResponse.json({ user })
    }

    // If not found in User table, check Staff table
    const staff = await prisma.staff.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true
      }
    })

    if (staff) {
      return NextResponse.json({
        user: {
          id: staff.id,
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          profileImage: staff.profileImage
        }
      })
    }

    return NextResponse.json({ user: null })
  } catch (error) {
    console.error("Error searching user:", error)
    return NextResponse.json(
      { error: "Failed to search user" },
      { status: 500 }
    )
  }
})