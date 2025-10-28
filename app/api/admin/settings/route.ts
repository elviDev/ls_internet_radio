import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

const settingsSchema = z.object({
  // General Dashboard Settings
  dashboardTitle: z.string().min(1).optional(),
  organizationName: z.string().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  
  // Broadcast Settings
  defaultBroadcastQuality: z.string().optional(),
  defaultStreamDelay: z.number().int().min(0).max(60).optional(),
  maxConcurrentListeners: z.number().int().min(1).optional(),
  autoRecordBroadcasts: z.boolean().optional(),
  enableChatModeration: z.boolean().optional(),
  defaultRecordingFormat: z.enum(["MP3", "WAV", "FLAC"]).optional(),
  
  // Content Settings
  defaultAudioQuality: z.string().optional(),
  allowFileUploads: z.boolean().optional(),
  maxFileUploadSize: z.number().int().min(1024).max(1073741824).optional(), // 1KB to 1GB
  allowedFileTypes: z.string().optional(),
  enableTranscription: z.boolean().optional(),
  autoGenerateTranscripts: z.boolean().optional(),
  
  // Notification Settings
  enableEmailNotifications: z.boolean().optional(),
  enableSMSNotifications: z.boolean().optional(),
  enableSlackNotifications: z.boolean().optional(),
  notificationEmail: z.string().email().nullable().optional(),
  slackWebhookUrl: z.string().url().nullable().optional(),
  smsProviderConfig: z.string().nullable().optional(),
  
  // Security Settings
  enableTwoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.number().int().min(300).max(86400).optional(), // 5 min to 24 hours
  passwordMinLength: z.number().int().min(6).max(128).optional(),
  requirePasswordComplexity: z.boolean().optional(),
  maxLoginAttempts: z.number().int().min(1).max(10).optional(),
  lockoutDuration: z.number().int().min(60).max(3600).optional(), // 1 min to 1 hour
  
  // Analytics & Monitoring
  enableAnalytics: z.boolean().optional(),
  analyticsProvider: z.enum(["internal", "google", "mixpanel", "segment"]).optional(),
  enableErrorReporting: z.boolean().optional(),
  enablePerformanceMonitoring: z.boolean().optional(),
  dataRetentionDays: z.number().int().min(1).max(365).optional(),
  
  // API & Integration Settings
  enablePublicAPI: z.boolean().optional(),
  apiRateLimit: z.number().int().min(100).max(10000).optional(),
  enableWebhooks: z.boolean().optional(),
  webhookSigningSecret: z.string().nullable().optional(),
  
  // Backup & Maintenance
  enableAutomaticBackups: z.boolean().optional(),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  backupRetentionDays: z.number().int().min(1).max(365).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
  
  // Content Moderation
  enableContentModeration: z.boolean().optional(),
  autoFlagInappropriate: z.boolean().optional(),
  requireContentApproval: z.boolean().optional(),
  moderationKeywords: z.string().nullable().optional(),
})

// GET /api/admin/settings - Get dashboard settings
export const GET = adminOnly(async (req: Request) => {
  try {
    let settings = await prisma.dashboardSettings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.dashboardSettings.create({
        data: {}
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/settings - Update dashboard settings
export const PATCH = adminOnly(async (req: Request) => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = settingsSchema.parse(body)

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

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
})

// POST /api/admin/settings/reset - Reset to default settings
export const POST = adminOnly(async (req: Request) => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete existing settings
    await prisma.dashboardSettings.deleteMany()
    
    // Create new default settings
    const settings = await prisma.dashboardSettings.create({
      data: {
        lastUpdatedBy: user.id,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error resetting settings:", error)
    return NextResponse.json(
      { error: "Failed to reset settings" },
      { status: 500 }
    )
  }
})