import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart, Mic, Upload, CalendarIcon, Users, Radio, Headphones, BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-64 border-r bg-muted/40">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-lg">WaveStream</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground"
            >
              <BarChart className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/broadcasts"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Radio className="h-4 w-4" />
              Broadcasts
            </Link>
            <Link
              href="/admin/podcasts"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Mic className="h-4 w-4" />
              Podcasts
            </Link>
            <Link
              href="/admin/audiobooks"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Audiobooks
            </Link>
            <Link
              href="/admin/programs"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Clock className="h-4 w-4" />
              Programs
            </Link>
            <Link
              href="/admin/events"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
              Events
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          </div>
        </nav>
      </aside>
      <div className="flex-1">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 gap-4">
            <div className="md:hidden">
              <Button variant="outline" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </Button>
            </div>
            <div className="relative w-full max-w-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8 rounded-full bg-muted md:w-[200px] lg:w-[300px]"
              />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="outline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
                Notifications
              </Button>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Image
                  src="/placeholder.svg?height=32&width=32"
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </Button>
            </div>
          </div>
        </header>
        <main className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, Admin!</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Mic className="h-4 w-4 mr-2" /> Start Broadcast
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Upload Content
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Listeners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,543</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Live Listeners</CardTitle>
                <Radio className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+5% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Podcast Downloads</CardTitle>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,732</div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Audiobook Plays</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3,451</div>
                <p className="text-xs text-muted-foreground">+7% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Listener Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                <p className="text-muted-foreground">Analytics chart will be displayed here</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Top Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Headphones className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Morning Jazz Sessions</h4>
                      <p className="text-xs text-muted-foreground">2,345 plays</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Mic className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Tech Talk Weekly</h4>
                      <p className="text-xs text-muted-foreground">1,987 plays</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">The Mystery Hour</h4>
                      <p className="text-xs text-muted-foreground">1,756 plays</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Radio className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Evening News Roundup</h4>
                      <p className="text-xs text-muted-foreground">1,543 plays</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-purple-600 pl-4 py-1">
                    <p className="text-sm">New podcast uploaded: "Tech Talk Weekly #45"</p>
                    <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">Live broadcast started: "Morning Jazz Sessions"</p>
                    <p className="text-xs text-muted-foreground">Today, 8:00 AM</p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">New event created: "Summer Music Festival"</p>
                    <p className="text-xs text-muted-foreground">Yesterday, 4:15 PM</p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">User feedback received from John D.</p>
                    <p className="text-xs text-muted-foreground">Yesterday, 2:30 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Broadcasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Evening News Roundup</h4>
                      <p className="text-xs text-muted-foreground">Today, 6:00 PM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Tech Talk Weekly</h4>
                      <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Weekend Music Mix</h4>
                      <p className="text-xs text-muted-foreground">Saturday, 2:00 PM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-24 flex flex-col items-center justify-center gap-2">
                    <Mic className="h-6 w-6" />
                    <span>New Podcast</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Radio className="h-6 w-6" />
                    <span>Schedule Broadcast</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <CalendarIcon className="h-6 w-6" />
                    <span>Create Event</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
