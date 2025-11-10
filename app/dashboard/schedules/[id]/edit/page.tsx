"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Tag,
  Repeat,
  Bell,
  Zap,
  Megaphone,
  Music,
  Plus,
  X,
  Users,
  Save,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function DatePicker({
  date,
  onDateChange,
  placeholder
}: {
  date?: Date
  onDateChange: (date?: Date) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          readOnly
          value={date ? format(date, "yyyy-MM-dd") : ""}
          placeholder={placeholder}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onDateChange(d as Date | undefined)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  type: z.enum(["EVENT", "CAMPAIGN", "ADVERTISEMENT", "LIVE_BROADCAST", "ANNOUNCEMENT", "MAINTENANCE"]),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED", "FAILED"]),
  // store dates as ISO date strings (YYYY-MM-DD) to match form values
  startTime: z.string().min(1, "Start date is required"),
  startTimeHour: z.string().default("09"),
  startTimeMinute: z.string().default("00"),
  endTime: z.string().optional(),
  endTimeHour: z.string().default("10"),
  endTimeMinute: z.string().default("00"),
  duration: z.string().optional(),
  priority: z.string().min(0).max(10),
  assignedTo: z.string().optional(),
  isRecurring: z.boolean(),
  tags: z.string().optional()
})

type FormData = z.infer<typeof scheduleSchema>

type Staff = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

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
  assignedTo?: string
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
  createdAt: string
  updatedAt: string
}

const scheduleTypes = [
  { 
    value: "EVENT", 
    label: "Event", 
    icon: CalendarIcon, 
    description: "Concerts, meetups, interviews, contests",
    color: "bg-blue-500"
  },
  { 
    value: "CAMPAIGN", 
    label: "Marketing Campaign", 
    icon: Megaphone, 
    description: "Promotional campaigns, brand activations",
    color: "bg-green-500"
  },
  { 
    value: "ADVERTISEMENT", 
    label: "Advertisement", 
    icon: Zap, 
    description: "Audio spots, banners, sponsored content",
    color: "bg-yellow-500"
  },
  { 
    value: "LIVE_BROADCAST", 
    label: "Live Broadcast", 
    icon: Music, 
    description: "Live shows, streaming sessions",
    color: "bg-red-500"
  },
  { 
    value: "ANNOUNCEMENT", 
    label: "Announcement", 
    icon: Bell, 
    description: "Important announcements, updates",
    color: "bg-purple-500"
  },
  { 
    value: "MAINTENANCE", 
    label: "Maintenance", 
    icon: Users, 
    description: "System maintenance, technical tasks",
    color: "bg-gray-500"
  }
]

const statusOptions = [
  { value: "DRAFT", label: "Draft", description: "Work in progress" },
  { value: "SCHEDULED", label: "Scheduled", description: "Ready and scheduled" },
  { value: "ACTIVE", label: "Active", description: "Currently running" },
  { value: "COMPLETED", label: "Completed", description: "Successfully completed" },
  { value: "CANCELLED", label: "Cancelled", description: "Cancelled or postponed" },
  { value: "FAILED", label: "Failed", description: "Failed to execute" }
]

export default function EditSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schedule, setSchedule] = useState<Schedule | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "EVENT",
      status: "DRAFT",
      startTime: "",
      endTime: "",
      duration: "",
      priority: "0",
      assignedTo: "none",
      isRecurring: false,
      tags: ""
    }
  })

  useEffect(() => {
    if (params.id) {
      fetchSchedule()
      fetchStaff()
    }
  }, [params.id])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/schedules/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
        
        // Convert datetime to date format
        const startTime = new Date(data.startTime).toISOString().split('T')[0]
        const endTime = data.endTime ? new Date(data.endTime).toISOString().split('T')[0] : ""
        
        form.reset({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          startTime,
          endTime,
          duration: data.duration?.toString() || "",
          priority: data.priority?.toString() || "0",
          assignedTo: data.assignee?.id || "none",
          isRecurring: data.isRecurring,
          tags: data.tags || ""
        })
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/schedules/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          startTime: data.startTime,
          endTime: data.endTime || undefined,
          duration: data.duration ? parseInt(data.duration) : undefined,
          priority: parseInt(data.priority),
          assignedTo: data.assignedTo === "none" ? undefined : data.assignedTo || undefined,
          isRecurring: data.isRecurring,
          tags: data.tags || undefined
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update schedule")
      }

      toast({
        title: "Success",
        description: "Schedule updated successfully"
      })
      
      router.push(`/dashboard/schedules/${params.id}`)
    } catch (error) {
      console.error("Failed to update schedule:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
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
              The schedule you're trying to edit doesn't exist or may have been deleted.
            </p>
            <Button onClick={() => router.push("/dashboard/schedules")}>
              Back to Schedules
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Schedule</h1>
          <p className="text-muted-foreground">Modify schedule details and settings</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter schedule title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your schedule..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scheduleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div>
                                <div className="font-medium">{status.label}</div>
                                <div className="text-xs text-muted-foreground">{status.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Timing</CardTitle>
              <CardDescription>
                Set the timing and duration for your schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                          placeholder="Select start date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                          placeholder="Select end date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="e.g., 60" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Duration in minutes (optional if end time is set)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Normal</SelectItem>
                          <SelectItem value="1">Low Priority</SelectItem>
                          <SelectItem value="2">Medium Priority</SelectItem>
                          <SelectItem value="3">High Priority</SelectItem>
                          <SelectItem value="4">Urgent</SelectItem>
                          <SelectItem value="5">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Recurring Schedule</FormLabel>
                      <FormDescription>
                        Enable if this is a recurring schedule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Assignment & Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment & Organization</CardTitle>
              <CardDescription>
                Assign the schedule and add organizational tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Assignment</SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tags separated by commas" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to help organize and filter schedules (comma-separated)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}