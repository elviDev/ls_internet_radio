import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

// GET /api/admin/schedules - Get all schedules with filters
export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "20")
    const type = searchParams.get("type") || "all"
    const status = searchParams.get("status") || "all"
    const assignedTo = searchParams.get("assignedTo") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * perPage

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (type !== "all") {
      where.type = type
    }
    
    if (status !== "all") {
      where.status = status
    }
    
    if (assignedTo !== "all") {
      where.assignedTo = assignedTo
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [schedules, totalCount] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          event: true,
          campaign: true,
          advertisement: true,
          liveBroadcast: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              status: true,
              streamUrl: true,
              hostUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              banner: {
                select: {
                  id: true,
                  url: true,
                  originalName: true,
                  type: true
                }
              },
              program: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              },
              staff: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      email: true,
                      profileImage: true
                    }
                  }
                },
                where: { isActive: true }
              },
              guests: true
            }
          }
        },
        orderBy: { startTime: "asc" },
        skip,
        take: perPage
      }),
      prisma.schedule.count({ where })
    ])

    return NextResponse.json({
      schedules,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      }
    })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    )
  }
})

// POST /api/admin/schedules - Create new schedule
export const POST = adminOnly(async (req: Request) => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      duration,
      assignedTo,
      priority,
      tags,
      isRecurring,
      recurringPattern,
      recurringEndDate,
      notifyStaff,
      notifyUsers,
      autoPublish,
      // Type-specific data
      eventData,
      campaignData,
      advertisementData
    } = body

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        type,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        assignedTo,
        priority: priority || 0,
        tags,
        isRecurring: isRecurring || false,
        recurringPattern,
        recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
        notifyStaff: notifyStaff !== false,
        notifyUsers: notifyUsers || false,
        autoPublish: autoPublish || false,
        createdBy: user.id,
        status: "DRAFT"
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Create type-specific data
    if (type === "EVENT" && eventData) {
      await prisma.event.create({
        data: {
          scheduleId: schedule.id,
          organizer: user.id,
          ...eventData
        }
      })
    }

    if (type === "CAMPAIGN" && campaignData) {
      await prisma.campaign.create({
        data: {
          scheduleId: schedule.id,
          manager: user.id,
          ...campaignData
        }
      })
    }

    if (type === "ADVERTISEMENT" && advertisementData) {
      await prisma.advertisement.create({
        data: {
          scheduleId: schedule.id,
          ...advertisementData
        }
      })
    }

    // Create LiveBroadcast for LIVE_BROADCAST type schedules
    if (type === "LIVE_BROADCAST") {
      const broadcast = await prisma.liveBroadcast.create({
        data: {
          title,
          description: description || "",
          slug: generateSlug(title),
          hostId: assignedTo || user.id,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          status: "SCHEDULED",
          programId: body.programId || null,
        }
      })

      // Link the broadcast to the schedule
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { liveBroadcastId: broadcast.id }
      })
    }

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
})