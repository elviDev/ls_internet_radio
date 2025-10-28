import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";

const updateStaffSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "ADMIN", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  salary: z.number().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const GET = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
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
        address: true,
        emergencyContact: true,
        profileImage: true,
        isActive: true,
        startDate: true,
        endDate: true,
        salary: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            podcasts: true,
            audiobooks: true,
            hostedBroadcasts: true,
            uploadedAssets: true,
          }
        },
        podcasts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        audiobooks: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        hostedBroadcasts: {
          select: {
            id: true,
            title: true,
            status: true,
            startTime: true,
          },
          orderBy: { startTime: "desc" },
          take: 5,
        },
        broadcastStaff: {
          select: {
            id: true,
            role: true,
            isActive: true,
            broadcast: {
              select: {
                id: true,
                title: true,
                status: true,
                startTime: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...staff,
      name: `${staff.firstName} ${staff.lastName}`,
      contentCount: staff._count.podcasts + staff._count.audiobooks + staff._count.hostedBroadcasts,
      assetsCount: staff._count.uploadedAssets,
      broadcastCount: staff.hostedBroadcasts.length + staff.broadcastStaff.length,
      joinedAt: staff.createdAt.toISOString(),
      lastActive: staff.updatedAt.toISOString(),
      startDate: staff.startDate?.toISOString(),
      endDate: staff.endDate?.toISOString(),
    });
  } catch (error) {
    console.error("Get staff member error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
});

export const PATCH = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const data = updateStaffSchema.parse(body);
    
    // Get the current user to check permissions
    const currentUser = await getCurrentUser();
    
    // Staff can only edit their own details, unless they are ADMIN
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    // Check if username or email already exists (excluding current user)
    if (data.username || data.email) {
      const existingUser = await prisma.staff.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                data.username ? { username: data.username } : {},
                data.email ? { email: data.email } : {},
              ].filter(obj => Object.keys(obj).length > 0)
            }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username or email already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...data };
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
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
        endDate: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...staff,
      name: `${staff.firstName} ${staff.lastName}`,
      joinedAt: staff.createdAt.toISOString(),
      lastActive: staff.updatedAt.toISOString(),
      startDate: staff.startDate?.toISOString(),
      endDate: staff.endDate?.toISOString(),
    });
  } catch (error) {
    console.error("Update staff member error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
});

export const DELETE = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    // Get the current user to check permissions
    const currentUser = await getCurrentUser();
    
    // Staff can only delete their own account, unless they are ADMIN
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: "You can only delete your own account" },
        { status: 403 }
      );
    }
    
    // Check if staff member exists
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Check if staff member has active broadcasts
    const activeParticipation = await prisma.broadcastStaff.count({
      where: {
        userId: params.id,
        isActive: true,
        broadcast: {
          status: "LIVE"
        }
      }
    });

    if (activeParticipation > 0) {
      return NextResponse.json(
        { error: "Cannot delete staff member with active broadcasts. Please end their broadcasts first." },
        { status: 400 }
      );
    }

    // Hard delete (you can change this to soft delete by setting isActive: false)
    await prisma.staff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Staff member deleted successfully",
      deletedStaff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
      },
    });
  } catch (error) {
    console.error("Delete staff member error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
});