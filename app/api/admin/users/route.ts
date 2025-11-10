import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET /api/admin/users - Get all users with filters and pagination
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is staff (not just a regular user)
    if (user.role === 'USER' || !user.isApproved) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const isSuspended = searchParams.get("isSuspended");
    const emailVerified = searchParams.get("emailVerified");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== "all") {
      where.isActive = isActive === "true";
    }
    
    if (isSuspended !== null && isSuspended !== undefined && isSuspended !== "all") {
      where.isSuspended = isSuspended === "true";
    }
    
    if (emailVerified !== null && emailVerified !== undefined && emailVerified !== "all") {
      where.emailVerified = emailVerified === "true";
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Get users data
    const [users, totalCount, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          profileImage: true,
          isActive: true,
          isSuspended: true,
          suspendedAt: true,
          suspendedReason: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              comments: true,
              reviews: true,
              playlists: true,
              favorites: true,
              bookmarks: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: perPage,
      }),
      prisma.user.count({ where }),
      // Get stats
      Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isSuspended: true } }),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]),
    ]);

    const [activeUsers, suspendedUsers, verifiedUsers, newUsers, activeLastMonth] = stats;

    const userStats = {
      total: totalCount,
      active: activeUsers,
      suspended: suspendedUsers,
      verified: verifiedUsers,
      newUsers,
      activeLastMonth,
      unverified: totalCount - verifiedUsers,
    };

    // Transform users data
    const transformedUsers = users.map(user => ({
      ...user,
      activityCount: user._count.comments + user._count.reviews + user._count.playlists,
      joinedAt: user.createdAt.toISOString(),
      lastActive: user.updatedAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString(),
      suspendedAt: user.suspendedAt?.toISOString(),
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
      stats: userStats,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
