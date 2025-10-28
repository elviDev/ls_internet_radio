import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

const categorySchemas = {
  general: z.object({
    dashboardTitle: z.string().min(1).optional(),
    organizationName: z.string().min(1).optional(),
    logoUrl: z.string().url().nullable().optional(),
    faviconUrl: z.string().url().nullable().optional(),
    theme: z.enum(["light", "dark", "auto"]).optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  }),
  
  broadcast: z.object({
    defaultBroadcastQuality: z.string().optional(),
    defaultStreamDelay: z.number().int().min(0).max(60).optional(),
    maxConcurrentListeners: z.number().int().min(1).optional(),
    autoRecordBroadcasts: z.boolean().optional(),
    enableChatModeration: z.boolean().optional(),
    defaultRecordingFormat: z.enum(["MP3", "WAV", "FLAC"]).optional(),
  }),
  
  content: z.object({
    defaultAudioQuality: z.string().optional(),
    allowFileUploads: z.boolean().optional(),
    maxFileUploadSize: z.number().int().min(1024).max(1073741824).optional(),
    allowedFileTypes: z.string().optional(),
    enableTranscription: z.boolean().optional(),
    autoGenerateTranscripts: z.boolean().optional(),
  }),
  
  notifications: z.object({
    enableEmailNotifications: z.boolean().optional(),
    enableSMSNotifications: z.boolean().optional(),
    enableSlackNotifications: z.boolean().optional(),
    notificationEmail: z.string().email().nullable().optional(),
    slackWebhookUrl: z.string().url().nullable().optional(),
    smsProviderConfig: z.string().nullable().optional(),
  }),
  
  security: z.object({
    enableTwoFactorAuth: z.boolean().optional(),
    sessionTimeout: z.number().int().min(300).max(86400).optional(),
    passwordMinLength: z.number().int().min(6).max(128).optional(),
    requirePasswordComplexity: z.boolean().optional(),
    maxLoginAttempts: z.number().int().min(1).max(10).optional(),
    lockoutDuration: z.number().int().min(60).max(3600).optional(),
  }),
  
  analytics: z.object({
    enableAnalytics: z.boolean().optional(),
    analyticsProvider: z.enum(["internal", "google", "mixpanel", "segment"]).optional(),
    enableErrorReporting: z.boolean().optional(),
    enablePerformanceMonitoring: z.boolean().optional(),
    dataRetentionDays: z.number().int().min(1).max(365).optional(),
  }),
  
  api: z.object({
    enablePublicAPI: z.boolean().optional(),
    apiRateLimit: z.number().int().min(100).max(10000).optional(),
    enableWebhooks: z.boolean().optional(),
    webhookSigningSecret: z.string().nullable().optional(),
  }),
  
  backup: z.object({
    enableAutomaticBackups: z.boolean().optional(),
    backupFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
    backupRetentionDays: z.number().int().min(1).max(365).optional(),
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().nullable().optional(),
  }),
  
  moderation: z.object({
    enableContentModeration: z.boolean().optional(),
    autoFlagInappropriate: z.boolean().optional(),
    requireContentApproval: z.boolean().optional(),
    moderationKeywords: z.string().nullable().optional(),
  })
}

// GET /api/admin/settings/[category] - Get settings for a specific category
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ category: string }> }) => {
  try {
    const { category } = await params
    
    if (!Object.keys(categorySchemas).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }
    
    let settings = await prisma.dashboardSettings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.dashboardSettings.create({
        data: {}
      })
    }
    
    // Filter settings to only include the requested category fields
    const categoryFields = Object.keys(categorySchemas[category as keyof typeof categorySchemas].shape)
    const categorySettings = Object.fromEntries(
      Object.entries(settings).filter(([key]) => categoryFields.includes(key))
    )
    
    return NextResponse.json(categorySettings)
  } catch (error) {
    console.error(`Error fetching ${(await params).category} settings:`, error)
    return NextResponse.json(
      { error: `Failed to fetch ${(await params).category} settings` },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/settings/[category] - Update settings for a specific category
export const PATCH = adminOnly(async (req: Request, { params }: { params: Promise<{ category: string }> }) => {
  try {
    const { category } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!Object.keys(categorySchemas).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const schema = categorySchemas[category as keyof typeof categorySchemas]
    const data = schema.parse(body)

    // Check if settings exist
    let settings = await prisma.dashboardSettings.findFirst()
    
    if (!settings) {
      // Create new settings with provided data
      settings = await prisma.dashboardSettings.create({
        data: {
          ...data,
          lastUpdatedBy: user.id,
        }
      })
    } else {
      // Update existing settings
      settings = await prisma.dashboardSettings.update({
        where: { id: settings.id },
        data: {
          ...data,
          lastUpdatedBy: user.id,
        }
      })
    }

    // Return only the updated category fields
    const categoryFields = Object.keys(schema.shape)
    const categorySettings = Object.fromEntries(
      Object.entries(settings).filter(([key]) => categoryFields.includes(key))
    )

    return NextResponse.json(categorySettings)
  } catch (error) {
    console.error(`Error updating ${(await params).category} settings:`, error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to update ${(await params).category} settings` },
      { status: 500 }
    )
  }
})