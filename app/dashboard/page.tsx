"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic,
  Upload,
  CalendarIcon,
  Users,
  Radio,
  Headphones,
  BookOpen,
  Clock,
} from "lucide-react";

interface Analytics {
  totalListeners: number;
  liveListeners: number;
  podcastDownloads: number;
  audiobookPlays: number;
  userGrowth: string;
  listenerGrowth: string;
  podcastGrowth: string;
  audiobookGrowth: string;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalListeners: 0,
    liveListeners: 0,
    podcastDownloads: 0,
    audiobookPlays: 0,
    userGrowth: "0",
    listenerGrowth: "0",
    podcastGrowth: "0",
    audiobookGrowth: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Use fallback data
          setAnalytics({
            totalListeners: 12543,
            liveListeners: 1247,
            podcastDownloads: 8732,
            audiobookPlays: 3451,
            userGrowth: "12",
            listenerGrowth: "5",
            podcastGrowth: "18",
            audiobookGrowth: "7",
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Use fallback data
        setAnalytics({
          totalListeners: 12543,
          liveListeners: 1247,
          podcastDownloads: 8732,
          audiobookPlays: 3451,
          userGrowth: "12",
          listenerGrowth: "5",
          podcastGrowth: "18",
          audiobookGrowth: "7",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-muted-foreground">Welcome back to your admin dashboard!</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
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
                <CardTitle className="text-sm font-medium">
                  Total Listeners
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalListeners?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.userGrowth || '0'}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Live Listeners
                </CardTitle>
                <Radio className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.liveListeners?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.listenerGrowth || '0'}% from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Podcast Downloads
                </CardTitle>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.podcastDownloads?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.podcastGrowth || '0'}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Audiobook Plays
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.audiobookPlays?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.audiobookGrowth || '0'}% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Listener Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                <p className="text-muted-foreground">
                  Analytics chart will be displayed here
                </p>
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
                      <Headphones className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">
                        Morning Jazz Sessions
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        2,345 plays
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Mic className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Tech Talk Weekly</h4>
                      <p className="text-xs text-muted-foreground">
                        1,987 plays
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">The Mystery Hour</h4>
                      <p className="text-xs text-muted-foreground">
                        1,756 plays
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <Radio className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">
                        Evening News Roundup
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        1,543 plays
                      </p>
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
                  <div className="border-l-2 border-emerald-600 pl-4 py-1">
                    <p className="text-sm">
                      New podcast uploaded: "Tech Talk Weekly #45"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Today, 10:30 AM
                    </p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">
                      Live broadcast started: "Morning Jazz Sessions"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Today, 8:00 AM
                    </p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">
                      New event created: "Summer Music Festival"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Yesterday, 4:15 PM
                    </p>
                  </div>
                  <div className="border-l-2 border-muted pl-4 py-1">
                    <p className="text-sm">
                      User feedback received from John D.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Yesterday, 2:30 PM
                    </p>
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
                    <div className="h-10 w-10 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">
                        Evening News Roundup
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Today, 6:00 PM
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Tech Talk Weekly</h4>
                      <p className="text-xs text-muted-foreground">
                        Tomorrow, 10:00 AM
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Weekend Music Mix</h4>
                      <p className="text-xs text-muted-foreground">
                        Saturday, 2:00 PM
                      </p>
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
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <Radio className="h-6 w-6" />
                    <span>Schedule Broadcast</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <CalendarIcon className="h-6 w-6" />
                    <span>Create Event</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
    </>
  );
}
