import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";

export const GET = adminOnly(async () => {
  try {
    // Get user statistics
    const totalUsers = await prisma.user.count();
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // Get content statistics
    const totalAudiobooks = await prisma.audiobook.count();
    const publishedAudiobooks = await prisma.audiobook.count({
      where: { status: "PUBLISHED" },
    });

    // Mock data for features not yet implemented
    const analytics = {
      totalListeners: totalUsers,
      liveListeners: Math.floor(Math.random() * 500) + 100, // Mock live data
      podcastDownloads: Math.floor(Math.random() * 10000) + 5000,
      audiobookPlays: publishedAudiobooks * 50, // Mock calculation
      
      // Growth metrics
      userGrowth: newUsersThisMonth > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : "0",
      listenerGrowth: "5", // Mock data
      podcastGrowth: "18", // Mock data
      audiobookGrowth: "7", // Mock data
      
      // Content stats
      totalContent: {
        audiobooks: totalAudiobooks,
        publishedAudiobooks,
        podcasts: 0, // To be implemented
        liveShows: 0, // To be implemented
        events: 0, // To be implemented
      },
      
      // Recent activity (mock data)
      recentActivities: [
        {
          id: 1,
          type: "podcast",
          title: "New podcast uploaded: \"Tech Talk Weekly #45\"",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          highlighted: true,
        },
        {
          id: 2,
          type: "broadcast",
          title: "Live broadcast started: \"Morning Jazz Sessions\"",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          highlighted: false,
        },
        {
          id: 3,
          type: "event",
          title: "New event created: \"Summer Music Festival\"",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          highlighted: false,
        },
        {
          id: 4,
          type: "feedback",
          title: "User feedback received from John D.",
          timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
          highlighted: false,
        },
      ],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
});