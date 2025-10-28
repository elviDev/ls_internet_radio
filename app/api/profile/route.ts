import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = 'role' in currentUser && currentUser.role !== 'USER';

    if (isStaff) {
      // Staff profile
      const staff = await prisma.staff.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          profileImage: true,
          isActive: true,
          startDate: true,
          createdAt: true,
          _count: {
            select: {
              podcasts: true,
              audiobooks: true,
              hostedBroadcasts: true
            }
          }
        }
      });

      return NextResponse.json({
        type: 'staff',
        profile: staff,
        stats: {
          contentCreated: (staff?._count.podcasts || 0) + (staff?._count.audiobooks || 0),
          broadcastsHosted: staff?._count.hostedBroadcasts || 0
        }
      });
    } else {
      // User profile
      const [user, favorites, inProgress, completed, playlists] = await Promise.all([
        prisma.user.findUnique({
          where: { id: currentUser.id },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            bio: true,
            profileImage: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        }),
        prisma.favorite.findMany({
          where: { userId: currentUser.id },
          include: {
            audiobook: { select: { id: true, title: true, coverImage: true, narrator: true } },
            podcast: { select: { id: true, title: true, coverImage: true, host: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.playbackProgress.findMany({
          where: { 
            userId: currentUser.id,
            position: { gt: 0, lt: 100 }
          },
          include: {
            audiobook: { select: { id: true, title: true, coverImage: true, duration: true } },
            podcast: { select: { id: true, title: true, coverImage: true, duration: true } }
          },
          orderBy: { updatedAt: 'desc' },
          take: 10
        }),
        prisma.mediaHistory.findMany({
          where: { userId: currentUser.id },
          include: {
            audiobook: { select: { id: true, title: true, coverImage: true } },
            podcast: { select: { id: true, title: true, coverImage: true } }
          },
          orderBy: { listenedAt: 'desc' },
          take: 20
        }),
        prisma.playlist.findMany({
          where: { userId: currentUser.id },
          include: {
            _count: { select: { items: true } }
          },
          orderBy: { updatedAt: 'desc' }
        })
      ]);

      return NextResponse.json({
        type: 'user',
        profile: user,
        favorites,
        inProgress,
        completed: completed.filter(item => {
          const progress = inProgress.find(p => 
            (p.audiobookId && p.audiobookId === item.audiobookId) ||
            (p.podcastId && p.podcastId === item.podcastId)
          );
          return !progress;
        }),
        playlists,
        stats: {
          totalListened: completed.length,
          favoritesCount: favorites.length,
          playlistsCount: playlists.length,
          inProgressCount: inProgress.length
        }
      });
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const isStaff = 'role' in currentUser && currentUser.role !== 'USER';

    if (isStaff) {
      const updated = await prisma.staff.update({
        where: { id: currentUser.id },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          bio: body.bio,
          phone: body.phone,
          profileImage: body.profileImage
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          bio: true,
          phone: true,
          profileImage: true
        }
      });
      return NextResponse.json(updated);
    } else {
      const updated = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: body.name,
          username: body.username,
          bio: body.bio,
          profileImage: body.profileImage
        },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          profileImage: true
        }
      });
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}