import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

const prisma = new PrismaClient()

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  eventType: z.enum(["CONCERT", "MEETUP", "INTERVIEW", "SPECIAL_BROADCAST", "CONTEST", "GIVEAWAY", "COMMUNITY_EVENT", "FUNDRAISER"]),
  location: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional(),
  isPaid: z.boolean().default(false),
  ticketPrice: z.number().nonnegative().optional(),
  maxAttendees: z.number().positive().optional(),
  requiresRSVP: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).default("DRAFT")
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    const where: any = {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }
    if (upcoming) {
      where.eventDate = {
        gte: new Date(),
      };
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
              status: true
            }
          },
          organizerStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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
      isPaid: event.isPaid,
      ticketPrice: event.ticketPrice,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      status: event.schedule.status,
      organizer: {
        id: event.organizerStaff.id,
        name: `${event.organizerStaff.firstName} ${event.organizerStaff.lastName}`,
        email: event.organizerStaff.email
      },
      createdAt: event.createdAt
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
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createEventSchema.parse(body);



    // Create schedule first
    const schedule = await prisma.schedule.create({
      data: {
        title: data.title,
        description: data.description,
        type: "EVENT",
        status: data.status,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        createdBy: user.id
      }
    })

    // Create event
    const event = await prisma.event.create({
      data: {
        scheduleId: schedule.id,
        eventType: data.eventType,
        location: data.location,
        venue: data.venue,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        isVirtual: data.isVirtual,
        virtualLink: data.virtualLink,
        isPaid: data.isPaid,
        ticketPrice: data.ticketPrice,
        maxAttendees: data.maxAttendees,
        requiresRSVP: data.requiresRSVP,
        imageUrl: data.imageUrl,
        bannerUrl: data.bannerUrl,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactPerson: data.contactPerson,
        organizer: user.id
      },
      include: {
        schedule: true,
        organizerStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Create event error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}