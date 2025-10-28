import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

const prisma = new PrismaClient()

const updateEventSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  eventType: z.enum(["CONCERT", "MEETUP", "INTERVIEW", "SPECIAL_BROADCAST", "CONTEST", "GIVEAWAY", "COMMUNITY_EVENT", "FUNDRAISER"]).optional(),
  location: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isVirtual: z.boolean().optional(),
  virtualLink: z.string().url().optional(),
  isPaid: z.boolean().optional(),
  ticketPrice: z.number().nonnegative().optional(),
  maxAttendees: z.number().positive().optional(),
  requiresRSVP: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateEventSchema.parse(body)

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { schedule: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update schedule if needed
    const scheduleData: any = {}
    if (data.title) scheduleData.title = data.title
    if (data.description) scheduleData.description = data.description
    if (data.startTime) scheduleData.startTime = new Date(data.startTime)
    if (data.endTime) scheduleData.endTime = new Date(data.endTime)
    if (data.status) scheduleData.status = data.status

    if (Object.keys(scheduleData).length > 0) {
      await prisma.schedule.update({
        where: { id: existingEvent.scheduleId },
        data: scheduleData
      })
    }

    // Update event
    const eventData: any = {}
    if (data.eventType) eventData.eventType = data.eventType
    if (data.location !== undefined) eventData.location = data.location
    if (data.venue !== undefined) eventData.venue = data.venue
    if (data.address !== undefined) eventData.address = data.address
    if (data.city !== undefined) eventData.city = data.city
    if (data.state !== undefined) eventData.state = data.state
    if (data.country !== undefined) eventData.country = data.country
    if (data.isVirtual !== undefined) eventData.isVirtual = data.isVirtual
    if (data.virtualLink !== undefined) eventData.virtualLink = data.virtualLink
    if (data.isPaid !== undefined) eventData.isPaid = data.isPaid
    if (data.ticketPrice !== undefined) eventData.ticketPrice = data.ticketPrice
    if (data.maxAttendees !== undefined) eventData.maxAttendees = data.maxAttendees
    if (data.requiresRSVP !== undefined) eventData.requiresRSVP = data.requiresRSVP
    if (data.imageUrl !== undefined) eventData.imageUrl = data.imageUrl
    if (data.bannerUrl !== undefined) eventData.bannerUrl = data.bannerUrl
    if (data.contactEmail !== undefined) eventData.contactEmail = data.contactEmail
    if (data.contactPhone !== undefined) eventData.contactPhone = data.contactPhone
    if (data.contactPerson !== undefined) eventData.contactPerson = data.contactPerson

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: eventData,
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

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error("Error updating event:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { schedule: true }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Delete event and its schedule
    await prisma.$transaction([
      prisma.event.delete({ where: { id } }),
      prisma.schedule.delete({ where: { id: event.scheduleId } })
    ])

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}