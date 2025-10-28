"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type DashboardSettings = {
  id?: string
  // General
  dashboardTitle: string
  organizationName: string
  logoUrl?: string | null
  faviconUrl?: string | null
  theme: "light" | "dark" | "auto"
  primaryColor: string
  secondaryColor: string
  
  // Broadcast
  defaultBroadcastQuality: string
  defaultStreamDelay: number
  maxConcurrentListeners: number
  autoRecordBroadcasts: boolean
  enableChatModeration: boolean
  defaultRecordingFormat: string
  
  // Content
  defaultAudioQuality: string
  allowFileUploads: boolean
  maxFileUploadSize: number
  allowedFileTypes: string
  enableTranscription: boolean
  autoGenerateTranscripts: boolean
  
  // Notifications
  enableEmailNotifications: boolean
  enableSMSNotifications: boolean
  enableSlackNotifications: boolean
  notificationEmail?: string | null
  slackWebhookUrl?: string | null
  smsProviderConfig?: string | null
  
  // Security
  enableTwoFactorAuth: boolean
  sessionTimeout: number
  passwordMinLength: number
  requirePasswordComplexity: boolean
  maxLoginAttempts: number
  lockoutDuration: number
  
  // Analytics
  enableAnalytics: boolean
  analyticsProvider: string
  enableErrorReporting: boolean
  enablePerformanceMonitoring: boolean
  dataRetentionDays: number
  
  // API
  enablePublicAPI: boolean
  apiRateLimit: number
  enableWebhooks: boolean
  webhookSigningSecret?: string | null
  
  // Backup
  enableAutomaticBackups: boolean
  backupFrequency: string
  backupRetentionDays: number
  maintenanceMode: boolean
  maintenanceMessage?: string | null
  
  // Moderation
  enableContentModeration: boolean
  autoFlagInappropriate: boolean
  requireContentApproval: boolean
  moderationKeywords?: string | null
  
  // Meta
  lastUpdatedBy?: string
  createdAt?: string
  updatedAt?: string
}

const defaultSettings: DashboardSettings = {
  dashboardTitle: "Radio Dashboard",
  organizationName: "Internet Radio Station",
  theme: "light",
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  defaultBroadcastQuality: "HD",
  defaultStreamDelay: 5,
  maxConcurrentListeners: 1000,
  autoRecordBroadcasts: false,
  enableChatModeration: true,
  defaultRecordingFormat: "MP3",
  defaultAudioQuality: "128kbps",
  allowFileUploads: true,
  maxFileUploadSize: 104857600,
  allowedFileTypes: "mp3,wav,flac,m4a",
  enableTranscription: true,
  autoGenerateTranscripts: false,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  enableSlackNotifications: false,
  enableTwoFactorAuth: false,
  sessionTimeout: 3600,
  passwordMinLength: 8,
  requirePasswordComplexity: true,
  maxLoginAttempts: 5,
  lockoutDuration: 900,
  enableAnalytics: true,
  analyticsProvider: "internal",
  enableErrorReporting: true,
  enablePerformanceMonitoring: true,
  dataRetentionDays: 90,
  enablePublicAPI: false,
  apiRateLimit: 1000,
  enableWebhooks: false,
  enableAutomaticBackups: true,
  backupFrequency: "daily",
  backupRetentionDays: 30,
  maintenanceMode: false,
  enableContentModeration: true,
  autoFlagInappropriate: true,
  requireContentApproval: false,
}

type DashboardSettingsContextType = {
  settings: DashboardSettings
  updateSettings: (newSettings: Partial<DashboardSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
  loading: boolean
  error: string | null
}

const DashboardSettingsContext = createContext<DashboardSettingsContextType | undefined>(undefined)

export function DashboardSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      } else {
        throw new Error('Failed to fetch settings')
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
      // Use default settings on error
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<DashboardSettings>) => {
    try {
      setError(null)
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      throw err
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Apply theme changes to document
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (settings.theme === 'auto') {
      // Auto theme - follow system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const updateTheme = () => {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      
      updateTheme()
      mediaQuery.addEventListener('change', updateTheme)
      
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [settings.theme])

  // Apply custom CSS variables for colors
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--primary-color', settings.primaryColor)
    root.style.setProperty('--secondary-color', settings.secondaryColor)
  }, [settings.primaryColor, settings.secondaryColor])

  // Update document title
  useEffect(() => {
    if (typeof window === 'undefined') return

    document.title = settings.dashboardTitle
  }, [settings.dashboardTitle])

  return (
    <DashboardSettingsContext.Provider value={{
      settings,
      updateSettings,
      refreshSettings,
      loading,
      error
    }}>
      {children}
    </DashboardSettingsContext.Provider>
  )
}

export function useDashboardSettings() {
  const context = useContext(DashboardSettingsContext)
  if (context === undefined) {
    throw new Error('useDashboardSettings must be used within a DashboardSettingsProvider')
  }
  return context
}

export type { DashboardSettings }