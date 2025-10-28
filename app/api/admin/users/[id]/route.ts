import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

const suspendUserSchema = z.object({
  isSuspended: z.boolean(),
  suspendedReason: z.string().optional(),
});

// GET /api/admin/users/[id] - Get single user details
export const GET = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
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
            mediaHistories: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            audiobook: {
              select: { title: true }
            },
            podcast: {
              select: { title: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            audiobook: {
              select: { title: true }
            },
            podcast: {
              select: { title: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        playlists: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
            createdAt: true,
            _count: {
              select: { items: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transformedUser = {
      ...user,
      activityCount: user._count.comments + user._count.reviews + user._count.playlists,
      totalInteractions: user._count.comments + user._count.reviews + user._count.favorites + user._count.bookmarks,
      joinedAt: user.createdAt.toISOString(),
      lastActive: user.updatedAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString(),
      suspendedAt: user.suspendedAt?.toISOString(),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
});

// PATCH /api/admin/users/[id] - Update user details or suspend/unsuspend
export const PATCH = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    
    // Check if this is a suspension action
    if ("isSuspended" in body) {
      const data = suspendUserSchema.parse(body);
      
      const updateData: any = {
        isSuspended: data.isSuspended,
      };
      
      if (data.isSuspended) {
        updateData.suspendedAt = new Date();
        updateData.suspendedReason = data.suspendedReason || "No reason provided";
      } else {
        updateData.suspendedAt = null;
        updateData.suspendedReason = null;
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          isSuspended: true,
          suspendedAt: true,
          suspendedReason: true,
        },
      });
      
      return NextResponse.json({
        message: `User ${data.isSuspended ? "suspended" : "unsuspended"} successfully`,
        user: {
          ...updatedUser,
          suspendedAt: updatedUser.suspendedAt?.toISOString(),
        },
      });
    }
    
    // Regular user update
    const data = updateUserSchema.parse(body);

    // Check if username or email already exists (excluding current user)
    if (data.username || data.email) {
      const existingUser = await prisma.user.findFirst({
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

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...data,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        isActive: true,
        isSuspended: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        ...updatedUser,
        joinedAt: updatedUser.createdAt.toISOString(),
        lastActive: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/users/[id] - Delete user account
export const DELETE = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hard delete (you can change this to soft delete by setting isActive: false)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
});
