"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardSettings, type DashboardSettings } from "@/contexts/dashboard-settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  Save,
  RotateCcw,
  Monitor,
  Radio,
  FileText,
  Bell,
  Shield,
  BarChart3,
  Code,
  Database,
  UserCheck,
  Loader2,
  Check,
  X,
  Info
} from "lucide-react"

type DashboardSettings = {
  id?: string
  // General
  dashboardTitle: string
  organizationName: string
  logoUrl?: string
  faviconUrl?: string
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
  notificationEmail?: string
  slackWebhookUrl?: string
  smsProviderConfig?: string
  
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
  webhookSigningSecret?: string
  
  // Backup
  enableAutomaticBackups: boolean
  backupFrequency: string
  backupRetentionDays: number
  maintenanceMode: boolean
  maintenanceMessage?: string
  
  // Moderation
  enableContentModeration: boolean
  autoFlagInappropriate: boolean
  requireContentApproval: boolean
  moderationKeywords?: string
  
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

export default function SettingsPage() {
  const { settings, updateSettings, refreshSettings, loading, error } = useDashboardSettings()
  const [localSettings, setLocalSettings] = useState<DashboardSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof DashboardSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setUnsavedChanges(false)
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
        setUnsavedChanges(false)
        toast.success('Settings reset to defaults')
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Settings</h1>
          <p className="text-muted-foreground">
            Configure your radio dashboard preferences and system settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
              <Info className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all settings to their default values. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={saveSettings} disabled={saving || !unsavedChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Moderation
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Dashboard Settings</CardTitle>
              <CardDescription>
                Configure the basic appearance and branding of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dashboardTitle">Dashboard Title</Label>
                  <Input
                    id="dashboardTitle"
                    value={settings.dashboardTitle}
                    onChange={(e) => updateSetting('dashboardTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={settings.organizationName}
                    onChange={(e) => updateSetting('organizationName', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={settings.logoUrl || ""}
                    onChange={(e) => updateSetting('logoUrl', e.target.value || null)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    type="url"
                    value={settings.faviconUrl || ""}
                    onChange={(e) => updateSetting('faviconUrl', e.target.value || null)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast Settings */}
        <TabsContent value="broadcast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Settings</CardTitle>
              <CardDescription>
                Configure default settings for live broadcasts and streaming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultBroadcastQuality">Default Quality</Label>
                  <Select 
                    value={settings.defaultBroadcastQuality} 
                    onValueChange={(value) => updateSetting('defaultBroadcastQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD">SD (Standard Definition)</SelectItem>
                      <SelectItem value="HD">HD (High Definition)</SelectItem>
                      <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultStreamDelay">Stream Delay (seconds)</Label>
                  <Input
                    id="defaultStreamDelay"
                    type="number"
                    min="0"
                    max="60"
                    value={settings.defaultStreamDelay}
                    onChange={(e) => updateSetting('defaultStreamDelay', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentListeners">Max Concurrent Listeners</Label>
                  <Input
                    id="maxConcurrentListeners"
                    type="number"
                    min="1"
                    value={settings.maxConcurrentListeners}
                    onChange={(e) => updateSetting('maxConcurrentListeners', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-record Broadcasts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically record all live broadcasts
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRecordBroadcasts}
                    onCheckedChange={(checked) => updateSetting('autoRecordBroadcasts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Chat Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic moderation for broadcast chat
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableChatModeration}
                    onCheckedChange={(checked) => updateSetting('enableChatModeration', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRecordingFormat">Default Recording Format</Label>
                <Select 
                  value={settings.defaultRecordingFormat} 
                  onValueChange={(value) => updateSetting('defaultRecordingFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MP3">MP3</SelectItem>
                    <SelectItem value="WAV">WAV</SelectItem>
                    <SelectItem value="FLAC">FLAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add more TabsContent for other categories... */}
        {/* For brevity, I'll continue with a few more important ones */}

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('enableTwoFactorAuth', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="300"
                    max="86400"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">5 minutes to 24 hours</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="128"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Password Complexity</Label>
                  <p className="text-sm text-muted-foreground">
                    Require uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
                <Switch
                  checked={settings.requirePasswordComplexity}
                  onCheckedChange={(checked) => updateSetting('requirePasswordComplexity', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (seconds)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="60"
                    max="3600"
                    value={settings.lockoutDuration}
                    onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">1 minute to 1 hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>
                Configure content upload and processing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow File Uploads</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable users to upload audio files
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowFileUploads}
                    onCheckedChange={(checked) => updateSetting('allowFileUploads', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Transcription</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable transcription features for audio content
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTranscription}
                    onCheckedChange={(checked) => updateSetting('enableTranscription', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-generate Transcripts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate transcripts for uploaded audio
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoGenerateTranscripts}
                    onCheckedChange={(checked) => updateSetting('autoGenerateTranscripts', checked)}
                    disabled={!settings.enableTranscription}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileUploadSize">Max Upload Size (bytes)</Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    min="1024"
                    max="1073741824"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => updateSetting('maxFileUploadSize', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {(settings.maxFileUploadSize / 1024 / 1024).toFixed(0)} MB
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                  <Input
                    id="allowedFileTypes"
                    value={settings.allowedFileTypes}
                    onChange={(e) => updateSetting('allowedFileTypes', e.target.value)}
                    placeholder="mp3,wav,flac,m4a"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add placeholder content for remaining tabs */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Settings</CardTitle>
              <CardDescription>Configure analytics and monitoring options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Configure API access and integration settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">API settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Maintenance Settings</CardTitle>
              <CardDescription>Configure backup schedules and maintenance options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Backup settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Settings</CardTitle>
              <CardDescription>Configure content moderation and approval workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Moderation settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}