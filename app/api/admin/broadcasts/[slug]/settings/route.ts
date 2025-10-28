import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";

const updateSettingsSchema = z.object({
  autoRecord: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
  chatModeration: z.boolean().optional(),
  allowGuests: z.boolean().optional(),
  maxListeners: z.number().min(1).max(10000).optional(),
  quality: z.enum(["HD", "SD", "Auto"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  slackNotifications: z.boolean().optional(),
  recordingFormat: z.enum(["MP3", "WAV", "FLAC"]).optional(),
  streamDelay: z.number().min(0).max(60).optional(),
});

export const GET = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        autoRecord: true,
        chatEnabled: true,
        chatModeration: true,
        allowGuests: true,
        maxListeners: true,
        quality: true,
        notificationsEnabled: true,
        emailNotifications: true,
        smsNotifications: true,
        slackNotifications: true,
        recordingFormat: true,
        streamDelay: true,
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Get broadcast settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcast settings" },
      { status: 500 }
    );
  }
});

export const PATCH = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    const body = await req.json();
    const data = updateSettingsSchema.parse(body);

    // Check if broadcast exists
    const existingBroadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
    });

    if (!existingBroadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    // Update broadcast settings
    const broadcast = await prisma.liveBroadcast.update({
      where: { slug: params.slug },
      data: {
        ...(data.autoRecord !== undefined && { autoRecord: data.autoRecord }),
        ...(data.chatEnabled !== undefined && { chatEnabled: data.chatEnabled }),
        ...(data.chatModeration !== undefined && { chatModeration: data.chatModeration }),
        ...(data.allowGuests !== undefined && { allowGuests: data.allowGuests }),
        ...(data.maxListeners !== undefined && { maxListeners: data.maxListeners }),
        ...(data.quality !== undefined && { quality: data.quality }),
        ...(data.notificationsEnabled !== undefined && { notificationsEnabled: data.notificationsEnabled }),
        ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
        ...(data.smsNotifications !== undefined && { smsNotifications: data.smsNotifications }),
        ...(data.slackNotifications !== undefined && { slackNotifications: data.slackNotifications }),
        ...(data.recordingFormat !== undefined && { recordingFormat: data.recordingFormat }),
        ...(data.streamDelay !== undefined && { streamDelay: data.streamDelay }),
      },
      select: {
        id: true,
        autoRecord: true,
        chatEnabled: true,
        chatModeration: true,
        allowGuests: true,
        maxListeners: true,
        quality: true,
        notificationsEnabled: true,
        emailNotifications: true,
        smsNotifications: true,
        slackNotifications: true,
        recordingFormat: true,
        streamDelay: true,
      },
    });

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Update broadcast settings error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update broadcast settings" },
      { status: 500 }
    );
  }
});