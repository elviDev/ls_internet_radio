import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/events - Get events for public display
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const upcoming = searchParams.get("upcoming") === "true"
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const now = new Date()
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Get events through their associated schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        type: "EVENT",
        startTime: upcoming ? {
          gte: now,
          lte: oneMonthFromNow
        } : undefined,
        status: {
          in: ["SCHEDULED", "ACTIVE", "PUBLISHED"]
        }
      },
      include: {
        event: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: upcoming 
        ? { startTime: "asc" }
        : { createdAt: "desc" },
      take: limit
    })

    // Transform the data for the frontend
    const transformedEvents = schedules
      .filter(schedule => schedule.event) // Only include schedules that have event data
      .map(schedule => ({
        id: schedule.event!.id,
        scheduleId: schedule.id,
        title: schedule.title,
        description: schedule.description,
        eventType: schedule.event!.eventType,
        location: schedule.event!.location,
        venue: schedule.event!.venue,
        address: schedule.event!.address,
        city: schedule.event!.city,
        state: schedule.event!.state,
        country: schedule.event!.country,
        isVirtual: schedule.event!.isVirtual,
        virtualLink: schedule.event!.virtualLink,
        isPaid: schedule.event!.isPaid,
        ticketPrice: schedule.event!.ticketPrice,
        currency: schedule.event!.currency,
        maxAttendees: schedule.event!.maxAttendees,
        currentAttendees: schedule.event!.currentAttendees,
        requiresRSVP: schedule.event!.requiresRSVP,
        imageUrl: schedule.event!.imageUrl,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: schedule.status,
        organizer: schedule.creator ? {
          id: schedule.creator.id,
          name: `${schedule.creator.firstName} ${schedule.creator.lastName}`
        } : null,
        tags: schedule.tags,
        createdAt: schedule.event!.createdAt,
        updatedAt: schedule.event!.updatedAt
      }))

    return NextResponse.json({
      events: transformedEvents,
      count: transformedEvents.length
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}