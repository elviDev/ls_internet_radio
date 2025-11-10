"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  type: z.enum(["EVENT", "CAMPAIGN", "ADVERTISEMENT", "LIVE_BROADCAST", "ANNOUNCEMENT", "MAINTENANCE"]),
  startTime: z.date(),
  startTimeHour: z.string().default("09"),
  startTimeMinute: z.string().default("00"),
  endTime: z.date().optional(),
  endTimeHour: z.string().default("10"),
  endTimeMinute: z.string().default("00"),
  duration: z.number().min(1).optional(),
  assignedTo: z.string().optional(),
  programId: z.string().optional(),
  priority: z.number().min(0).max(10).default(0),
  tags: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  recurringEndDate: z.string().optional(),
  notifyStaff: z.boolean().default(true),
  notifyUsers: z.boolean().default(false),
  autoPublish: z.boolean().default(false)
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

type Staff = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

type Program = {
  id: string
  title: string
  slug: string
  category: string
  status: string
}

const scheduleTypes = [
  { 
    value: "LIVE_BROADCAST", 
    label: "Live Show", 
    icon: Music, 
    description: "Live radio shows, talk shows, music programs",
    color: "bg-red-500"
  },
  { 
    value: "EVENT", 
    label: "Station Event", 
    icon: CalendarIcon, 
    description: "Concerts, listener meetups, interviews, contests",
    color: "bg-blue-500"
  },
  { 
    value: "ADVERTISEMENT", 
    label: "Commercial Spot", 
    icon: Zap, 
    description: "Audio advertisements, sponsor spots, PSAs",
    color: "bg-yellow-500"
  },
  { 
    value: "CAMPAIGN", 
    label: "Promotion Campaign", 
    icon: Megaphone, 
    description: "Station promotions, listener drives, contests",
    color: "bg-green-500"
  },
  { 
    value: "ANNOUNCEMENT", 
    label: "Station Announcement", 
    icon: Bell, 
    description: "Important updates, weather alerts, news bulletins",
    color: "bg-purple-500"
  },
  { 
    value: "MAINTENANCE", 
    label: "Technical Break", 
    icon: Users, 
    description: "Equipment maintenance, system updates, downtime",
    color: "bg-gray-500"
  }
]

export default function NewSchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [staff, setStaff] = useState<Staff[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "EVENT",
      startTime: undefined as Date | undefined,
      startTimeHour: "09",
      startTimeMinute: "00",
      endTime: undefined as Date | undefined,
      endTimeHour: "10",
      endTimeMinute: "00",
      assignedTo: "",
      programId: "",
      priority: 0,
      tags: "",
      isRecurring: false,
      notifyStaff: true,
      notifyUsers: false,
      autoPublish: false
    }
  })

  useEffect(() => {
    fetchStaff()
    fetchPrograms()
  }, [])

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

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/admin/programs?perPage=100")
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue('tags', newTags.join(', '))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setValue('tags', newTags.join(', '))
  }

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true)

    try {
      // Combine date and time for start time
      const startDateTime = data.startTime ? new Date(data.startTime) : null
      if (startDateTime) {
        startDateTime.setHours(parseInt(data.startTimeHour), parseInt(data.startTimeMinute))
      }

      // Combine date and time for end time
      const endDateTime = data.endTime ? new Date(data.endTime) : null
      if (endDateTime) {
        endDateTime.setHours(parseInt(data.endTimeHour), parseInt(data.endTimeMinute))
      }

      const scheduleData = {
        ...data,
        startTime: startDateTime?.toISOString(),
        endTime: endDateTime?.toISOString(),
        programId: data.programId && data.programId !== "no-program" ? data.programId : null
      }

      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create schedule')
      }

      const schedule = await response.json()
      
      toast({
        title: "Success", 
        description: data.type === "LIVE_BROADCAST" 
          ? `Broadcast "${data.title}" scheduled successfully` 
          : `Schedule "${data.title}" created successfully`
      })

      // Redirect to the appropriate section based on type
      if (data.type === "LIVE_BROADCAST") {
        router.push(`/dashboard/broadcasts`)
      } else {
        router.push(`/dashboard/schedules`)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Radio Activity</h1>
          <p className="text-muted-foreground">Schedule shows, events, commercials, and station activities</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Activity Details
                  </CardTitle>
                  <CardDescription>
                    Enter the basic details for this radio station activity
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
                          <Input placeholder="Enter schedule title..." {...field} />
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
                            placeholder="Describe the schedule item..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of what this schedule item involves
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Schedule Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Type</CardTitle>
                  <CardDescription>
                    Choose the type of radio station activity you want to schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {scheduleTypes.map((type) => {
                              const Icon = type.icon
                              const isSelected = field.value === type.value
                              
                              return (
                                <div
                                  key={type.value}
                                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                    isSelected 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                  onClick={() => field.onChange(type.value)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${type.color} text-white`}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold">{type.label}</h3>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {type.description}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Timing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timing & Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Start Date and Time */}
                  <div className="space-y-2">
                    <FormLabel>Start Date & Time *</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "MMM dd, yyyy") : "Pick date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => field.onChange(date)}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startTimeHour"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startTimeMinute"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 4 }, (_, i) => (
                                    <SelectItem key={i} value={(i * 15).toString().padStart(2, '0')}>
                                      :{(i * 15).toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* End Date and Time */}
                  <div className="space-y-2">
                    <FormLabel>End Date & Time (Optional)</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "MMM dd, yyyy") : "Pick date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => field.onChange(date)}
                                    disabled={(date) => {
                                      const today = new Date(new Date().setHours(0, 0, 0, 0))
                                      const startDate = form.watch("startTime") ? new Date(form.watch("startTime")!.setHours(0, 0, 0, 0)) : today
                                      return date < startDate
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTimeHour"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTimeMinute"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 4 }, (_, i) => (
                                    <SelectItem key={i} value={(i * 15).toString().padStart(2, '0')}>
                                      :{(i * 15).toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter duration in minutes"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Specify duration if end time is not set
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Repeat className="h-4 w-4" />
                            Recurring Schedule
                          </FormLabel>
                          <FormDescription>
                            Make this a recurring schedule item
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

                  {form.watch("isRecurring") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recurringPattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurring Pattern</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurringEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurring End Date</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "justify-start text-left font-normal w-full",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), "MMM dd, yyyy") : "Pick date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                    disabled={(date) => {
                                      const today = new Date(new Date().setHours(0, 0, 0, 0))
                                      const startDate = form.watch("startTime") ? new Date(form.watch("startTime")!.setHours(0, 0, 0, 0)) : today
                                      return date < startDate
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {member.firstName} {member.lastName}
                                  <Badge variant="outline" className="text-xs">
                                    {member.role}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign this schedule item to a staff member
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Program Selection - Show only for LIVE_BROADCAST */}
                  {form.watch("type") === "LIVE_BROADCAST" && (
                    <FormField
                      control={form.control}
                      name="programId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Associated Program (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no-program">No Program</SelectItem>
                              {programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                  <div className="flex items-center gap-2">
                                    <Music className="h-4 w-4" />
                                    {program.title}
                                    <Badge variant="outline" className="text-xs">
                                      {program.category.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Link this broadcast to an existing program
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Normal</SelectItem>
                            <SelectItem value="1">Low Priority</SelectItem>
                            <SelectItem value="5">Medium Priority</SelectItem>
                            <SelectItem value="8">High Priority</SelectItem>
                            <SelectItem value="10">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" size="icon" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notifyStaff"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Notify Staff
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Send notifications to staff members
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

                  <FormField
                    control={form.control}
                    name="notifyUsers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Notify Users
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Send notifications to users
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

                  <FormField
                    control={form.control}
                    name="autoPublish"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Auto Publish
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Automatically publish when scheduled
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

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Schedule"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}