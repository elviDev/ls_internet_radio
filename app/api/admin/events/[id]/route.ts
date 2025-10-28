import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

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
  virtualLink: z.string().url().optional().or(z.literal("")),
  isPaid: z.boolean().optional(),
  ticketPrice: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  maxAttendees: z.number().positive().optional(),
  requiresRSVP: z.boolean().optional(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  galleryUrls: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  facebookEvent: z.string().url().optional().or(z.literal("")),
  twitterEvent: z.string().url().optional().or(z.literal("")),
  linkedinEvent: z.string().url().optional().or(z.literal("")),
  coOrganizers: z.string().optional(),
  sponsors: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]
    if (!user || !staffRoles.includes(user.role) || !user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
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
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const transformedEvent = {
      id: event.id,
      title: event.schedule.title,
      description: event.schedule.description,
      startTime: event.schedule.startTime,
      endTime: event.schedule.endTime,
      status: event.schedule.status,
      eventType: event.eventType,
      location: event.location,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      country: event.country,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      isPaid: event.isPaid,
      ticketPrice: event.ticketPrice,
      currency: event.currency,
      maxAttendees: event.maxAttendees,
      requiresRSVP: event.requiresRSVP,
      imageUrl: event.imageUrl,
      bannerUrl: event.bannerUrl,
      galleryUrls: event.galleryUrls,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      contactPerson: event.contactPerson,
      facebookEvent: event.facebookEvent,
      twitterEvent: event.twitterEvent,
      linkedinEvent: event.linkedinEvent,
      coOrganizers: event.coOrganizers,
      sponsors: event.sponsors,
      currentAttendees: event._count.registrations,
      registrations: event.registrations.map(reg => ({
        id: reg.id,
        user: reg.user,
        registeredAt: reg.registeredAt,
        paymentStatus: "PENDING", // Default for now, can be enhanced later
        paymentAmount: event.ticketPrice
      })),
      organizer: {
        id: event.organizerStaff.id,
        name: `${event.organizerStaff.firstName} ${event.organizerStaff.lastName}`,
        email: event.organizerStaff.email
      },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    }
    
    return NextResponse.json(transformedEvent)
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
    
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]
    if (!user || !staffRoles.includes(user.role) || !user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateEventSchema.parse(body)

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update using transaction to handle both Event and Schedule
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update schedule if needed
      const scheduleData: any = {}
      if (data.title !== undefined) scheduleData.title = data.title
      if (data.description !== undefined) scheduleData.description = data.description
      if (data.startTime !== undefined) scheduleData.startTime = new Date(data.startTime)
      if (data.endTime !== undefined) scheduleData.endTime = data.endTime ? new Date(data.endTime) : null
      if (data.status !== undefined) scheduleData.status = data.status

      if (Object.keys(scheduleData).length > 0) {
        await tx.schedule.update({
          where: { id: existingEvent.scheduleId },
          data: scheduleData
        })
      }

      // Update event
      const eventData: any = {}
      if (data.eventType !== undefined) eventData.eventType = data.eventType
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
      if (data.currency !== undefined) eventData.currency = data.currency
      if (data.maxAttendees !== undefined) eventData.maxAttendees = data.maxAttendees
      if (data.requiresRSVP !== undefined) eventData.requiresRSVP = data.requiresRSVP
      if (data.imageUrl !== undefined) eventData.imageUrl = data.imageUrl
      if (data.bannerUrl !== undefined) eventData.bannerUrl = data.bannerUrl
      if (data.galleryUrls !== undefined) eventData.galleryUrls = data.galleryUrls
      if (data.contactEmail !== undefined) eventData.contactEmail = data.contactEmail
      if (data.contactPhone !== undefined) eventData.contactPhone = data.contactPhone
      if (data.contactPerson !== undefined) eventData.contactPerson = data.contactPerson
      if (data.facebookEvent !== undefined) eventData.facebookEvent = data.facebookEvent
      if (data.twitterEvent !== undefined) eventData.twitterEvent = data.twitterEvent
      if (data.linkedinEvent !== undefined) eventData.linkedinEvent = data.linkedinEvent
      if (data.coOrganizers !== undefined) eventData.coOrganizers = data.coOrganizers
      if (data.sponsors !== undefined) eventData.sponsors = data.sponsors

      return await tx.event.update({
        where: { id },
        data: eventData,
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
          },
          registrations: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        }
      })
    })

    const transformedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.schedule.title,
      description: updatedEvent.schedule.description,
      startTime: updatedEvent.schedule.startTime,
      endTime: updatedEvent.schedule.endTime,
      status: updatedEvent.schedule.status,
      eventType: updatedEvent.eventType,
      location: updatedEvent.location,
      venue: updatedEvent.venue,
      address: updatedEvent.address,
      city: updatedEvent.city,
      state: updatedEvent.state,
      country: updatedEvent.country,
      isVirtual: updatedEvent.isVirtual,
      virtualLink: updatedEvent.virtualLink,
      isPaid: updatedEvent.isPaid,
      ticketPrice: updatedEvent.ticketPrice,
      currency: updatedEvent.currency,
      maxAttendees: updatedEvent.maxAttendees,
      requiresRSVP: updatedEvent.requiresRSVP,
      imageUrl: updatedEvent.imageUrl,
      bannerUrl: updatedEvent.bannerUrl,
      galleryUrls: updatedEvent.galleryUrls,
      contactEmail: updatedEvent.contactEmail,
      contactPhone: updatedEvent.contactPhone,
      contactPerson: updatedEvent.contactPerson,
      facebookEvent: updatedEvent.facebookEvent,
      twitterEvent: updatedEvent.twitterEvent,
      linkedinEvent: updatedEvent.linkedinEvent,
      coOrganizers: updatedEvent.coOrganizers,
      sponsors: updatedEvent.sponsors,
      currentAttendees: updatedEvent._count.registrations,
      organizer: {
        id: updatedEvent.organizerStaff.id,
        name: `${updatedEvent.organizerStaff.firstName} ${updatedEvent.organizerStaff.lastName}`,
        email: updatedEvent.organizerStaff.email
      },
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt
    }
    
    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation failed: ${errorMessage}` }, { status: 400 })
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
    
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]
    if (!user || !staffRoles.includes(user.role) || !user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Delete event and schedule in transaction (registrations will be cascade deleted)
    await prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { id } })
      await tx.schedule.delete({ where: { id: event.scheduleId } })
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}