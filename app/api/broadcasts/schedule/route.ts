import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/broadcasts/schedule - Get upcoming scheduled broadcasts
export async function GET() {
  try {
    const now = new Date()
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Get scheduled broadcasts for the next 7 days
    const scheduledBroadcasts = await prisma.liveBroadcast.findMany({
      where: {
        startTime: {
          gte: now,
          lte: endOfWeek
        },
        status: {
          in: ["SCHEDULED", "READY", "LIVE"]
        }
      },
      include: {
        hostUser: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        },
        program: {
          select: { 
            id: true, 
            title: true, 
            slug: true,
            category: true 
          }
        }
      },
      orderBy: { startTime: "asc" },
      take: 50 // Limit to 50 upcoming broadcasts
    })

    // Transform the data to match the current schedule format
    const schedule = scheduledBroadcasts.map(broadcast => {
      const startTime = new Date(broadcast.startTime)
      const endTime = broadcast.endTime ? new Date(broadcast.endTime) : null
      
      // Format time
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }
      
      // Determine day pattern
      const dayOfWeek = startTime.getDay() // 0 = Sunday, 1 = Monday, etc.
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      let dayPattern = "Weekdays"
      if (dayOfWeek === 0) dayPattern = "Sunday"
      else if (dayOfWeek === 6) dayPattern = "Saturday"
      else if (isWeekend) dayPattern = "Weekends"

      return {
        id: broadcast.id,
        show: broadcast.title,
        host: broadcast.hostUser ? `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}` : "Unknown Host",
        time: endTime 
          ? `${formatTime(startTime)} - ${formatTime(endTime)}`
          : `${formatTime(startTime)}`,
        day: dayPattern,
        startTime: broadcast.startTime,
        endTime: broadcast.endTime,
        program: broadcast.program,
        status: broadcast.status,
        slug: broadcast.slug
      }
    })

    return NextResponse.json({
      schedule,
      count: schedule.length,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error("Error fetching broadcast schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch broadcast schedule" },
      { status: 500 }
    )
  }
}