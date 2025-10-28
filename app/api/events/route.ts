import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const perPage = parseInt(searchParams.get("perPage") || "12", 10)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured") === "true"

    const where: any = {
      schedule: {
        status: "PUBLISHED",
        startTime: {
          gte: new Date()
        }
      }
    }

    if (category && category !== "all") {
      where.eventType = category.toUpperCase().replace("-", "_")
    }

    if (search) {
      where.OR = [
        { schedule: { title: { contains: search, mode: "insensitive" } } },
        { schedule: { description: { contains: search, mode: "insensitive" } } }
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { schedule: { startTime: "asc" } },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          schedule: {
            select: {
              id: true,
              title: true,
              description: true,
              startTime: true,
              endTime: true,
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          organizerStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.schedule.title,
      description: event.schedule.description,
      startTime: event.schedule.startTime,
      endTime: event.schedule.endTime,
      eventType: event.eventType,
      location: event.location,
      venue: event.venue,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      isPaid: event.isPaid,
      ticketPrice: event.ticketPrice,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      imageUrl: event.imageUrl,
      organizer: event.organizerStaff,
      isFeatured: event.currentAttendees > 50
    }))

    return NextResponse.json({
      events: transformedEvents,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}