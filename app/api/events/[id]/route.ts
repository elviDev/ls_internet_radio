import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

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
            status: true,
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
            lastName: true,
            bio: true,
            profileImage: true
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
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    let isRegistered = false
    if (user) {
      const actualUser = await prisma.user.findUnique({
        where: { email: user.email }
      })

      if (actualUser) {
        const registration = await prisma.eventRegistration.findUnique({
          where: {
            userId_eventId: {
              userId: actualUser.id,
              eventId: id
            }
          }
        })
        isRegistered = !!registration
      }
    }

    const transformedEvent = {
      id: event.id,
      title: event.schedule.title,
      description: event.schedule.description,
      startTime: event.schedule.startTime,
      endTime: event.schedule.endTime,
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
      currentAttendees: event._count.registrations,
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
      organizer: event.organizerStaff,
      status: event.schedule.status,
      isFeatured: event._count.registrations > 50,
      isRegistered
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