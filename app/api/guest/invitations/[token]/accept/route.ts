import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

// POST /api/guest/invitations/[token]/accept - Accept guest invitation
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Find the invitation
    const invitation = await prisma.guestInvitation.findUnique({
      where: { 
        invitationToken: params.token,
        status: 'PENDING'
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

    // Update invitation status
    await prisma.guestInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByUserId: user.id
      }
    })

    // Create or update podcast guest record
    await prisma.podcastGuest.upsert({
      where: {
        podcastId_userId: {
          podcastId: invitation.podcastId,
          userId: user.id
        }
      },
      update: {
        status: 'ACCEPTED',
        joinedAt: new Date()
      },
      create: {
        podcastId: invitation.podcastId,
        userId: user.id,
        status: 'ACCEPTED',
        invitedAt: new Date(),
        joinedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      podcastId: invitation.podcastId
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    )
  }
}