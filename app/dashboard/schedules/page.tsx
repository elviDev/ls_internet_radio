"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  Megaphone,
  Zap,
  Music,
  Users,
  Eye,
  Edit,
  Trash2,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"

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
  liveBroadcast?: {
    id: string
    slug: string
    status: string
    streamUrl?: string
    hostUser: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
  createdAt: string
  updatedAt: string
}

type Staff = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
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

export default function SchedulesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState("list")
  
  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: undefined as Date | undefined, end: undefined as Date | undefined })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchSchedules()
    fetchStaff()
  }, [currentPage, search, typeFilter, statusFilter, assigneeFilter, dateRange])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        perPage: "20",
        search,
        type: typeFilter,
        status: statusFilter,
        assignedTo: assigneeFilter,
        ...(dateRange.start && { startDate: dateRange.start.toISOString().split('T')[0] }),
        ...(dateRange.end && { endDate: dateRange.end.toISOString().split('T')[0] })
      })

      const response = await fetch(`/api/admin/schedules?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
      toast({
        title: "Error",
        description: "Failed to fetch schedules",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/admin/staff?perPage=100")
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
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

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/admin/schedules/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully"
        })
        fetchSchedules()
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

  const handleStatusToggle = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/schedules/${id}`, {
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
        fetchSchedules() // Refresh the schedules list
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

  const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
    const typeConfig = getTypeConfig(schedule.type)
    const StatusIcon = statusIcons[schedule.status as keyof typeof statusIcons]
    const TypeIcon = typeConfig.icon

    return (
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg ${typeConfig.color} text-white shrink-0`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold truncate">{schedule.title}</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  <Badge variant="outline" className={`${statusColors[schedule.status as keyof typeof statusColors]} text-xs w-fit`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {schedule.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {typeConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/dashboard/schedules/${schedule.id}`)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/dashboard/schedules/${schedule.id}/edit`)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteSchedule(schedule.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {schedule.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{formatDateTime(schedule.startTime)}</span>
              </div>
              {schedule.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{formatDuration(schedule.duration)}</span>
                </div>
              )}
            </div>

            {schedule.assignee && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {schedule.assignee.firstName} {schedule.assignee.lastName}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {schedule.assignee.role}
                </Badge>
              </div>
            )}

            {schedule.tags && (
              <div className="flex flex-wrap gap-1">
                {schedule.tags.split(",").slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
                {schedule.tags.split(",").length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{schedule.tags.split(",").length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t mt-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground truncate">
                Created by {schedule.creator.firstName} {schedule.creator.lastName}
              </span>
              
              <div className="flex flex-wrap gap-1">
                {/* Live Broadcast Actions */}
                {schedule.type === "LIVE_BROADCAST" && schedule.liveBroadcast && (
                  <>
                    {schedule.liveBroadcast.status === "SCHEDULED" && (
                      <Button 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/broadcasts/${schedule.liveBroadcast?.slug}/studio`)}
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                      >
                        Go Live
                      </Button>
                    )}
                    {schedule.liveBroadcast.status === "LIVE" && (
                      <Button 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/broadcasts/${schedule.liveBroadcast?.slug}/studio`)}
                        className="h-7 text-xs bg-red-600 hover:bg-red-700 animate-pulse"
                      >
                        Studio
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/broadcasts/${schedule.liveBroadcast?.slug}`)}
                      className="h-7 text-xs"
                    >
                      View
                    </Button>
                  </>
                )}
                
                {/* Regular Schedule Actions */}
                {schedule.type !== "LIVE_BROADCAST" && (
                  <>
                    {schedule.status === "DRAFT" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusToggle(schedule.id, "SCHEDULED")}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        Publish
                      </Button>
                    )}
                    {schedule.status === "SCHEDULED" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusToggle(schedule.id, "ACTIVE")}
                        className="h-7 text-xs border-green-600 text-green-600 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                    {schedule.status === "ACTIVE" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusToggle(schedule.id, "COMPLETED")}
                        className="h-7 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      >
                        Complete
                      </Button>
                    )}
                  </>
                )}
                
                {schedule.priority > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Priority {schedule.priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground">
            Manage events, campaigns, advertisements, and daily activities
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/schedules/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {scheduleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <DatePicker
                    date={dateRange.start}
                    onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    placeholder="Start date"
                    className="flex-1"
                  />
                  <DatePicker
                    date={dateRange.end}
                    onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    placeholder="End date"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={currentView} onValueChange={setCurrentView}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            {totalCount} schedule{totalCount !== 1 ? 's' : ''} found
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : schedules.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by creating your first schedule item
                </p>
                <Button onClick={() => router.push("/dashboard/schedules/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
                <p className="text-muted-foreground">
                  Calendar view coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}