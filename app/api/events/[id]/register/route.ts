import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if event exists and is available for registration
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        schedule: {
          select: {
            startTime: true,
            status: true
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

    if (event.schedule.status === "DRAFT" || event.schedule.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Event is not available for registration" },
        { status: 400 }
      )
    }

    if (new Date(event.schedule.startTime) < new Date()) {
      return NextResponse.json(
        { error: "Event has already started" },
        { status: 400 }
      )
    }

    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      return NextResponse.json(
        { error: "Event is full" },
        { status: 400 }
      )
    }

    // Find or create user record
    let actualUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!actualUser && user.role) {
      actualUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          password: 'staff_user'
        }
      })
    }

    if (!actualUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: actualUser.id,
          eventId: id
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 }
      )
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        userId: actualUser.id,
        eventId: id,
        registeredAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Successfully registered for event",
      registration
    })
  } catch (error) {
    console.error("Error registering for event:", error)
    return NextResponse.json(
      { error: "Failed to register for event" },
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
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    let actualUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!actualUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: actualUser.id,
          eventId: id
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Not registered for this event" },
        { status: 400 }
      )
    }

    // Delete registration
    await prisma.eventRegistration.delete({
      where: {
        userId_eventId: {
          userId: actualUser.id,
          eventId: id
        }
      }
    })

    return NextResponse.json({
      message: "Successfully unregistered from event"
    })
  } catch (error) {
    console.error("Error unregistering from event:", error)
    return NextResponse.json(
      { error: "Failed to unregister from event" },
      { status: 500 }
    )
  }
}