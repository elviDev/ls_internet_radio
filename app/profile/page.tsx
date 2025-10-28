"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Heart,
  Clock,
  CheckCircle,
  Music,
  Headphones,
  Mic,
  Users,
  Play,
  BookOpen,
  Star,
  TrendingUp,
  Plus,
  BarChart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MediaItem } from "@/components/profile/media-item"

const profileSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional()
})

type ProfileData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        
        // Set form values
        if (data.type === 'staff' && data.profile) {
          form.reset({
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            bio: data.profile.bio || '',
            phone: data.profile.phone || '',
            profileImage: data.profile.profileImage || ''
          })
        } else if (data.profile) {
          form.reset({
            name: data.profile.name || '',
            username: data.profile.username || '',
            bio: data.profile.bio || '',
            profileImage: data.profile.profileImage || ''
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileData) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchProfile()
        setIsEditing(false)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="h-96 bg-muted rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
        </div>
      </div>
    )
  }

  const isStaff = profile.type === 'staff'
  const displayName = isStaff 
    ? `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim() || 'Staff Member'
    : profile.profile?.name || profile.profile?.username || 'User'

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile?.profileImage || ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials(displayName || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.profile?.email || 'No email'}
              </CardDescription>
              {isStaff && (
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="secondary">{profile.profile?.role || 'Staff'}</Badge>
                  {profile.profile?.department && (
                    <Badge variant="outline">{profile.profile.department}</Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.profile?.bio && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{profile.profile.bio}</p>
                </div>
              )}
              
              {isStaff && profile.profile?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {profile.profile.phone}
                </div>
              )}
              
              {profile.profile?.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(profile.profile.createdAt)}
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t space-y-3">
                {isStaff ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Content Created</span>
                      <span className="font-medium">{profile.stats?.contentCreated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Broadcasts Hosted</span>
                      <span className="font-medium">{profile.stats?.broadcastsHosted || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Favorites</span>
                      <span className="font-medium">{profile.stats?.favoritesCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Playlists</span>
                      <span className="font-medium">{profile.stats?.playlistsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium">{profile.stats?.totalListened || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {isStaff ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={isStaff ? "overview" : "listening"} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                {isStaff ? (
                  <>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">My Content</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="listening">Listening</TabsTrigger>
                    <TabsTrigger value="favorites">Favorites</TabsTrigger>
                    <TabsTrigger value="playlists">Playlists</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Staff Overview */}
              {isStaff && (
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Mic className="h-5 w-5" />
                          Content Created
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{profile.stats?.contentCreated || 0}</div>
                        <p className="text-sm text-muted-foreground">Total episodes & books</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5" />
                          Broadcasts Hosted
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{profile.stats?.broadcastsHosted || 0}</div>
                        <p className="text-sm text-muted-foreground">Live sessions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="h-5 w-5" />
                          This Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">12</div>
                        <p className="text-sm text-muted-foreground">Scheduled items</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded border">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Published new podcast episode</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded border">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Updated audiobook chapter</p>
                            <p className="text-xs text-muted-foreground">1 day ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded border">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Scheduled live broadcast</p>
                            <p className="text-xs text-muted-foreground">3 days ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Podcast
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Add Audiobook Chapter
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Broadcast
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <BarChart className="h-4 w-4 mr-2" />
                          View Analytics
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {/* Staff Content Management */}
              {isStaff && (
                <TabsContent value="content" className="space-y-4">
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="h-5 w-5" />
                          My Podcasts
                        </CardTitle>
                        <CardDescription>Manage your podcast episodes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Mic className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Tech Talk Weekly</p>
                                <p className="text-sm text-muted-foreground">Episode 45 • Published</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Mic className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Morning Insights</p>
                                <p className="text-sm text-muted-foreground">Episode 12 • Draft</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          My Audiobooks
                        </CardTitle>
                        <CardDescription>Manage your audiobook projects</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">The Digital Revolution</p>
                                <p className="text-sm text-muted-foreground">12 chapters • Published</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Manage</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {/* Staff Schedule */}
              {isStaff && (
                <TabsContent value="schedule" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        My Schedule
                      </CardTitle>
                      <CardDescription>Upcoming broadcasts and deadlines</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold">15</div>
                            <div className="text-xs text-muted-foreground">DEC</div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Live Broadcast: Tech Talk</p>
                            <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM</p>
                          </div>
                          <Badge variant="secondary">Live</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold">18</div>
                            <div className="text-xs text-muted-foreground">DEC</div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Podcast Recording</p>
                            <p className="text-sm text-muted-foreground">10:00 AM - 11:30 AM</p>
                          </div>
                          <Badge variant="outline">Recording</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Staff Analytics */}
              {isStaff && (
                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart className="h-5 w-5" />
                          Content Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Plays</span>
                            <span className="font-medium">12,450</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Average Rating</span>
                            <span className="font-medium">4.8/5</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Completion Rate</span>
                            <span className="font-medium">78%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Audience Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Subscribers</span>
                            <span className="font-medium">2,340</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Monthly Growth</span>
                            <span className="font-medium text-green-600">+12%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Engagement Rate</span>
                            <span className="font-medium">65%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {/* Listening Progress (Users) */}
              {!isStaff && (
                <TabsContent value="listening" className="space-y-4">
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Continue Listening
                        </CardTitle>
                        <CardDescription>Pick up where you left off</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {profile.inProgress?.length > 0 ? (
                          <div className="space-y-4">
                            {profile.inProgress.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                  {item.audiobook ? <BookOpen className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {item.audiobook?.title || item.podcast?.title}
                                  </h4>
                                  <Progress value={item.position} className="mt-2" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.position}% complete
                                  </p>
                                </div>
                                <Button size="sm">
                                  <Play className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No content in progress
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}



              {/* Favorites */}
              <TabsContent value="favorites" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Your Favorites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.favorites?.length > 0 ? (
                      <div className="grid gap-3">
                        {profile.favorites.map((fav: any) => (
                          <MediaItem
                            key={fav.id}
                            item={fav}
                            onPlay={() => console.log('Play favorite:', fav)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No favorites yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Playlists (Users Only) */}
              {!isStaff && (
                <TabsContent value="playlists" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Your Playlists
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profile.playlists?.length > 0 ? (
                        <div className="grid gap-3">
                          {profile.playlists.map((playlist: any) => (
                            <div key={playlist.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Music className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{playlist.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {playlist._count.items} items
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No playlists created yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* History */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5" />
                      Listening History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.completed?.length > 0 ? (
                      <div className="space-y-3">
                        {profile.completed.slice(0, 10).map((item: any) => (
                          <MediaItem
                            key={item.id}
                            item={item}
                            variant="compact"
                            showDate={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No listening history yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}