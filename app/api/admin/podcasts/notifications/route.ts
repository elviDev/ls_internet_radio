import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// POST /api/admin/podcasts/notifications - Send notifications to existing users
export const POST = adminOnly(async (req: Request) => {
  try {
    const { podcastId, podcastTitle, userIds } = await req.json()

    if (!podcastId || !podcastTitle || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const notifications = []

    for (const userId of userIds) {
      // Create notification for existing user
      const notification = await prisma.notification.create({
        data: {
          userId,
          message: `You've been invited to participate in the podcast: "${podcastTitle}"`,
          link: `/podcasts/${podcastId}/guest-session`,
          isRead: false
        }
      })

      notifications.push(notification)
    }

    // Also create podcast guest records for tracking
    const guestRecords = await Promise.all(
      userIds.map(userId => 
        prisma.podcastGuest.create({
          data: {
            podcastId,
            userId,
            status: 'INVITED',
            invitedAt: new Date()
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      notifications,
      guestRecords,
      message: `${notifications.length} notification(s) sent successfully`
    })
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    )
  }
})