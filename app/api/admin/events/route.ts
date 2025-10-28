import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

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
  virtualLink: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid URL format"),
  isPaid: z.boolean().default(false),
  ticketPrice: z.number().nonnegative().optional(),
  currency: z.string().default("USD"),
  maxAttendees: z.number().positive().optional(),
  requiresRSVP: z.boolean().default(false),
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
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).default("DRAFT")
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]
    if (!user || !staffRoles.includes(user.role) || !user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "all") {
      where.schedule = {
        status: status.toUpperCase()
      };
    }
    if (upcoming) {
      where.schedule = {
        ...where.schedule,
        startTime: {
          gte: new Date(),
        }
      };
    }
    if (search) {
      where.OR = [
        { schedule: { title: { contains: search, mode: "insensitive" } } },
        { schedule: { description: { contains: search, mode: "insensitive" } } },
        { venue: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ];
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
          },
          _count: {
            select: {
              registrations: true
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
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]
    if (!user || !staffRoles.includes(user.role) || !user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let body: any
    
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // Handle FormData if needed in the future
      body = await request.json()
    }
    
    const data = createEventSchema.parse(body);



    // Create schedule first, then event
    const result = await prisma.$transaction(async (tx) => {
      // Create the schedule
      const schedule = await tx.schedule.create({
        data: {
          title: data.title,
          description: data.description,
          type: "EVENT",
          status: data.status || "DRAFT",
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          createdBy: user.id
        }
      });

      // Create the event
      const event = await tx.event.create({
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
          virtualLink: data.virtualLink && data.virtualLink.trim() ? data.virtualLink : null,
          isPaid: data.isPaid,
          ticketPrice: data.ticketPrice,
          currency: data.currency || "USD",
          maxAttendees: data.maxAttendees,
          requiresRSVP: data.requiresRSVP,
          imageUrl: data.imageUrl,
          bannerUrl: data.bannerUrl,
          galleryUrls: data.galleryUrls,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          contactPerson: data.contactPerson,
          facebookEvent: data.facebookEvent && data.facebookEvent.trim() ? data.facebookEvent : null,
          twitterEvent: data.twitterEvent && data.twitterEvent.trim() ? data.twitterEvent : null,
          linkedinEvent: data.linkedinEvent && data.linkedinEvent.trim() ? data.linkedinEvent : null,
          coOrganizers: data.coOrganizers,
          sponsors: data.sponsors,
          organizer: user.id
        },
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
      });

      return event;
    });

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Create event error:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation failed: ${errorMessage}` }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}