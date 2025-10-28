import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  playbackSpeed: z.number().min(0.5).max(3).optional(),
  playbackQuality: z.enum(["low", "medium", "high", "auto"]).optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = 'role' in currentUser && currentUser.role !== 'USER';

    const defaultSettings = {
      theme: "system",
      language: "en",
      timezone: "UTC",
      emailNotifications: true,
      pushNotifications: true,
      twoFactorEnabled: false,
      autoplay: true,
      playbackSpeed: 1.0,
      playbackQuality: "auto"
    };

    return NextResponse.json({ 
      type: isStaff ? 'staff' : 'user', 
      settings: defaultSettings 
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = settingsSchema.parse(body);

    // For now, just return the validated data since we don't have the fields in DB yet
    return NextResponse.json(validatedData);
  } catch (error) {
    console.error("Settings update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}