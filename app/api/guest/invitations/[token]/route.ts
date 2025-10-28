import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/guest/invitations/[token] - Get invitation details
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const invitation = await prisma.guestInvitation.findUnique({
      where: { 
        invitationToken: params.token,
        status: 'PENDING'
      },
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            description: true,
            host: true,
            releaseDate: true,
            duration: true,
            coverImage: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Error fetching invitation:", error)
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    )
  }
}