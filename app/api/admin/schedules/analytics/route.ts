import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { staffOnly } from "@/lib/auth/staffOnly"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await staffOnly(user)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get schedule statistics
    const [
      totalSchedules,
      activeSchedules,
      completedSchedules,
      failedSchedules,
      schedulsByType,
      recentSchedules,
      upcomingSchedules,
      performanceMetrics
    ] = await Promise.all([
      // Total schedules
      prisma.schedule.count(),
      
      // Active schedules
      prisma.schedule.count({
        where: { status: "ACTIVE" }
      }),
      
      // Completed schedules
      prisma.schedule.count({
        where: { status: "COMPLETED" }
      }),
      
      // Failed schedules
      prisma.schedule.count({
        where: { status: "FAILED" }
      }),
      
      // Schedules by type
      prisma.schedule.groupBy({
        by: ['type'],
        _count: true,
        orderBy: {
          _count: {
            type: 'desc'
          }
        }
      }),
      
      // Recent schedules
      prisma.schedule.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      
      // Upcoming schedules
      prisma.schedule.findMany({
        where: {
          startTime: {
            gte: new Date()
          },
          status: {
            in: ["SCHEDULED", "ACTIVE"]
          }
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        take: 10
      }),
      
      // Performance metrics
      Promise.all([
        // Events performance
        prisma.event.aggregate({
          _avg: { currentAttendees: true },
          _sum: { currentAttendees: true }
        }),
        
        // Campaign performance
        prisma.campaign.aggregate({
          _avg: { actualReach: true },
          _sum: { actualReach: true, budget: true }
        }),
        
        // Advertisement performance
        prisma.advertisement.aggregate({
          _avg: { playCount: true, clickCount: true },
          _sum: { playCount: true, clickCount: true, totalCost: true }
        })
      ])
    ])

    // Calculate completion rate
    const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0
    
    // Calculate failure rate
    const failureRate = totalSchedules > 0 ? (failedSchedules / totalSchedules) * 100 : 0

    // Process schedule trends (daily counts for the period)
    const trendData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        type
      FROM Schedule 
      WHERE createdAt >= ${startDate.toISOString()}
      GROUP BY DATE(createdAt), type
      ORDER BY date ASC
    `

    const analytics = {
      overview: {
        totalSchedules,
        activeSchedules,
        completedSchedules,
        failedSchedules,
        completionRate: Math.round(completionRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100
      },
      
      schedulesByType: schedulsByType.map(item => ({
        type: item.type,
        count: item._count,
        percentage: Math.round((item._count / totalSchedules) * 100 * 100) / 100
      })),
      
      recentActivity: recentSchedules.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        status: schedule.status,
        createdAt: schedule.createdAt,
        creator: `${schedule.creator.firstName} ${schedule.creator.lastName}`
      })),
      
      upcomingSchedules: upcomingSchedules.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        status: schedule.status,
        startTime: schedule.startTime,
        creator: `${schedule.creator.firstName} ${schedule.creator.lastName}`
      })),
      
      performance: {
        events: {
          averageAttendees: performanceMetrics[0]._avg.currentAttendees || 0,
          totalAttendees: performanceMetrics[0]._sum.currentAttendees || 0
        },
        campaigns: {
          averageReach: performanceMetrics[1]._avg.actualReach || 0,
          totalReach: performanceMetrics[1]._sum.actualReach || 0,
          totalBudget: performanceMetrics[1]._sum.budget || 0
        },
        advertisements: {
          averagePlayCount: performanceMetrics[2]._avg.playCount || 0,
          totalPlays: performanceMetrics[2]._sum.playCount || 0,
          totalClicks: performanceMetrics[2]._sum.clickCount || 0,
          totalRevenue: performanceMetrics[2]._sum.totalCost || 0,
          clickThroughRate: performanceMetrics[2]._sum.playCount > 0 
            ? (performanceMetrics[2]._sum.clickCount / performanceMetrics[2]._sum.playCount) * 100 
            : 0
        }
      },
      
      trends: trendData
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error("Error fetching schedule analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}