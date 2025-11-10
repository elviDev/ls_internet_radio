import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { StaffRole } from "@prisma/client";

const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "ADMIN", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  startDate: z.string().optional(),
  salary: z.number().optional(),
  bio: z.string().optional(),
});

export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    const where: any = {};
    
    if (role && role !== "all") {
      // Handle comma-separated roles
      const roles = role.split(',').map(r => r.trim());
      where.role = roles.length === 1 ? roles[0] : { in: roles };
    }
    
    if (department && department !== "all") {
      where.department = { contains: department, mode: "insensitive" };
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    const [staff, total, roleStats, departmentStats] = await Promise.all([
      prisma.staff.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          profileImage: true,
          isActive: true,
          isApproved: true,
          approvedAt: true,
          startDate: true,
          endDate: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              podcasts: true,
              audiobooks: true,
              hostedBroadcasts: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.staff.count(),
      prisma.staff.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.staff.groupBy({
        by: ["department"],
        _count: { department: true },
        where: { department: { not: null } },
      }),
    ]);

    // Calculate additional stats
    const activeStaff = await prisma.staff.count({ where: { isActive: true } });
    const recentHires = await prisma.staff.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const transformedStaff = staff.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      firstName: member.firstName,
      lastName: member.lastName,
      username: member.username,
      email: member.email,
      role: member.role,
      department: member.department,
      position: member.position,
      phone: member.phone,
      profileImage: member.profileImage,
      bio: member.bio,
      isActive: member.isActive,
      isApproved: member.isApproved,
      approvedAt: member.approvedAt?.toISOString(),
      startDate: member.startDate?.toISOString(),
      endDate: member.endDate?.toISOString(),
      contentCount: member._count.podcasts + member._count.audiobooks + member._count.hostedBroadcasts,
      joinedAt: member.createdAt.toISOString(),
      lastActive: member.updatedAt.toISOString(),
    }));

    const stats = {
      total,
      active: activeStaff,
      inactive: total - activeStaff,
      recentHires,
      byRole: roleStats.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      byDepartment: departmentStats.reduce((acc, item) => {
        if (item.department) {
          acc[item.department] = item._count.department;
        }
        return acc;
      }, {} as Record<string, number>),
    };
    
    return NextResponse.json({
      staff: transformedStaff,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      stats,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
});

export const POST = adminOnly(async (req: Request) => {
  try {
    const body = await req.json();
    const data = createStaffSchema.parse(body);

    // Check if username or email already exists
    const existingUser = await prisma.staff.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const staff = await prisma.staff.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role as any,
        department: data.department,
        position: data.position,
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact,
        startDate: data.startDate ? new Date(data.startDate) : null,
        salary: data.salary,
        bio: data.bio,
        emailVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        profileImage: true,
        isActive: true,
        startDate: true,
        bio: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      ...staff,
      name: `${staff.firstName} ${staff.lastName}`,
      contentCount: 0,
      joinedAt: staff.createdAt.toISOString(),
      startDate: staff.startDate?.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Create staff error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
});