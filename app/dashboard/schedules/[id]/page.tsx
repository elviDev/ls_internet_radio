"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  MapPin,
  Tag,
  Repeat,
  Users,
  Megaphone,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Schedule = {
  id: string
  title: string
  description: string
  type: string
  status: string
  startTime: string
  endTime?: string
  duration?: number
  priority: number
  tags?: string
  isRecurring: boolean
  creator: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  assignee?: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  event?: any
  campaign?: any
  advertisement?: any
  createdAt: string
  updatedAt: string
}

const scheduleTypes = [
  { value: "EVENT", label: "Event", icon: Calendar, color: "bg-blue-500" },
  { value: "CAMPAIGN", label: "Campaign", icon: Megaphone, color: "bg-green-500" },
  { value: "ADVERTISEMENT", label: "Advertisement", icon: Zap, color: "bg-yellow-500" },
  { value: "LIVE_BROADCAST", label: "Live Broadcast", icon: PlayCircle, color: "bg-red-500" },
  { value: "ANNOUNCEMENT", label: "Announcement", icon: AlertCircle, color: "bg-purple-500" },
  { value: "MAINTENANCE", label: "Maintenance", icon: Users, color: "bg-gray-500" }
]

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-orange-100 text-orange-800"
}

const statusIcons = {
  DRAFT: AlertCircle,
  SCHEDULED: Clock,
  ACTIVE: PlayCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  FAILED: AlertCircle
}

export default function ScheduleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchSchedule()
    }
  }, [params.id])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/schedules/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
      } else {
        throw new Error("Failed to fetch schedule")
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
      toast({
        title: "Error",
        description: "Failed to fetch schedule details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/admin/schedules/${params.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully"
        })
        router.push("/dashboard/schedules")
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      })
    }
  }

  const handleStatusToggle = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/schedules/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Schedule ${newStatus.toLowerCase()} successfully`
        })
        fetchSchedule() // Refresh the schedule data
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive"
      })
    }
  }

  const getTypeConfig = (type: string) => {
    return scheduleTypes.find(t => t.value === type) || scheduleTypes[0]
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Schedule Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Schedule not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The schedule you're looking for doesn't exist or may have been deleted.
            </p>
            <Button onClick={() => router.push("/dashboard/schedules")}>
              Back to Schedules
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typeConfig = getTypeConfig(schedule.type)
  const StatusIcon = statusIcons[schedule.status as keyof typeof statusIcons]
  const TypeIcon = typeConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{schedule.title}</h1>
            <p className="text-muted-foreground">Schedule Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Toggle Buttons */}
          {schedule.status === "DRAFT" && (
            <Button 
              onClick={() => handleStatusToggle("SCHEDULED")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {schedule.status === "SCHEDULED" && (
            <Button 
              variant="outline" 
              onClick={() => handleStatusToggle("DRAFT")}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Back to Draft
            </Button>
          )}
          {(schedule.status === "DRAFT" || schedule.status === "SCHEDULED") && (
            <Button 
              variant="outline" 
              onClick={() => handleStatusToggle("ACTIVE")}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          {schedule.status === "ACTIVE" && (
            <Button 
              variant="outline" 
              onClick={() => handleStatusToggle("COMPLETED")}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/schedules/${schedule.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteSchedule}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${typeConfig.color} text-white`}>
                  <TypeIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{schedule.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={statusColors[schedule.status as keyof typeof statusColors]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {schedule.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {typeConfig.label}
                    </span>
                    {schedule.priority > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Priority {schedule.priority}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{schedule.description}</p>
              </div>

              {schedule.tags && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {schedule.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Details */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Start Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(schedule.startTime)}
                    </p>
                  </div>
                </div>

                {schedule.endTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(schedule.endTime)}
                      </p>
                    </div>
                  </div>
                )}

                {schedule.duration && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(schedule.duration)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Recurring</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.isRecurring ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Created By
                </h4>
                <div className="text-sm">
                  <p className="font-medium">
                    {schedule.creator.firstName} {schedule.creator.lastName}
                  </p>
                  <p className="text-muted-foreground">{schedule.creator.email}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {schedule.creator.role}
                  </Badge>
                </div>
              </div>

              {schedule.assignee && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assigned To
                    </h4>
                    <div className="text-sm">
                      <p className="font-medium">
                        {schedule.assignee.firstName} {schedule.assignee.lastName}
                      </p>
                      <p className="text-muted-foreground">{schedule.assignee.email}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {schedule.assignee.role}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {formatDateTime(schedule.createdAt)}
                </p>
              </div>
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-muted-foreground">
                  {formatDateTime(schedule.updatedAt)}
                </p>
              </div>
              <div>
                <p className="font-medium">Schedule ID</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {schedule.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}