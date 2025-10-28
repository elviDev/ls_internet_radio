"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  Radio,
  BookOpen,
  Headphones,
  Activity,
  Star,
  TrendingUp,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface StaffDetail {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  bio?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  salary?: number;
  emailVerified: boolean;
  contentCount: number;
  assetsCount: number;
  broadcastCount: number;
  joinedAt: string;
  lastActive: string;
  podcasts: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  audiobooks: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  hostedBroadcasts: Array<{
    id: string;
    title: string;
    status: string;
    startTime: string;
  }>;
  broadcastStaff: Array<{
    id: string;
    role: string;
    isActive: boolean;
    broadcast: {
      id: string;
      title: string;
      status: string;
      startTime: string;
    };
  }>;
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const staffId = params.id as string;
  const isOwnProfile = user?.id === staffId;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwnProfile || isAdmin;
  const canDelete = isAdmin && !isOwnProfile;

  useEffect(() => {
    fetchStaffDetail();
  }, [staffId]);

  const fetchStaffDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/staff/${staffId}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch staff details",
          variant: "destructive",
        });
        router.push("/dashboard/staff");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff details",
        variant: "destructive",
      });
      router.push("/dashboard/staff");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!staff) return;

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staff.isActive }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Staff member ${!staff.isActive ? "activated" : "deactivated"} successfully`,
        });
        fetchStaffDetail();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update staff member",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staff) return;

    if (!confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        });
        router.push("/dashboard/staff");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete staff member",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-800",
      HOST: "bg-blue-100 text-blue-800",
      CO_HOST: "bg-indigo-100 text-indigo-800",
      PRODUCER: "bg-purple-100 text-purple-800",
      SOUND_ENGINEER: "bg-green-100 text-green-800",
      CONTENT_MANAGER: "bg-orange-100 text-orange-800",
      TECHNICAL_SUPPORT: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      LIVE: "bg-green-100 text-green-800",
      ENDED: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Staff member not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{staff.name}</h1>
            <p className="text-muted-foreground">Staff Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/staff/${staffId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleToggleActive}
              className={staff.isActive ? "text-red-600" : "text-green-600"}
            >
              {staff.isActive ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDeleteStaff}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={staff.profileImage} alt={staff.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(staff.firstName, staff.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{staff.name}</h2>
                <p className="text-muted-foreground">@{staff.username}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={getRoleBadgeColor(staff.role)}>
                    {staff.role.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant={staff.isActive ? "default" : "secondary"}
                    className={
                      staff.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {staff.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {staff.emailVerified && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{staff.email}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{staff.phone}</span>
                  </div>
                )}
                {staff.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{staff.address}</span>
                  </div>
                )}
                {staff.department && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{staff.department}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {staff.startDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started {formatDate(staff.startDate)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {formatDate(staff.joinedAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last active {formatDate(staff.lastActive)}</span>
                </div>
                {staff.position && (
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{staff.position}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {staff.bio && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-sm text-muted-foreground">{staff.bio}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.contentCount}</div>
            <p className="text-xs text-muted-foreground">
              {staff.podcasts.length} podcasts, {staff.audiobooks.length} audiobooks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Broadcasts</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.broadcastCount}</div>
            <p className="text-xs text-muted-foreground">
              {staff.hostedBroadcasts.length} hosted, {staff.broadcastStaff.length} participated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assets Uploaded</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.assetsCount}</div>
            <p className="text-xs text-muted-foreground">Media files uploaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Content Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Info</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Podcasts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Recent Podcasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.podcasts.length > 0 ? (
                  <div className="space-y-3">
                    {staff.podcasts.map((podcast) => (
                      <div key={podcast.id} className="border-l-2 border-blue-200 pl-3">
                        <h4 className="font-medium text-sm">{podcast.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(podcast.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No podcasts created yet</p>
                )}
              </CardContent>
            </Card>

            {/* Audiobooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Audiobooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.audiobooks.length > 0 ? (
                  <div className="space-y-3">
                    {staff.audiobooks.map((audiobook) => (
                      <div key={audiobook.id} className="border-l-2 border-green-200 pl-3">
                        <h4 className="font-medium text-sm">{audiobook.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(audiobook.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No audiobooks created yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Hosted Broadcasts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Hosted Broadcasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.hostedBroadcasts.length > 0 ? (
                  <div className="space-y-3">
                    {staff.hostedBroadcasts.map((broadcast) => (
                      <div key={broadcast.id} className="border-l-2 border-purple-200 pl-3">
                        <h4 className="font-medium text-sm">{broadcast.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusBadge(broadcast.status)}>
                            {broadcast.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(broadcast.startTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No broadcasts hosted yet</p>
                )}
              </CardContent>
            </Card>

            {/* Participated Broadcasts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participated Broadcasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.broadcastStaff.length > 0 ? (
                  <div className="space-y-3">
                    {staff.broadcastStaff.map((participation) => (
                      <div key={participation.id} className="border-l-2 border-orange-200 pl-3">
                        <h4 className="font-medium text-sm">{participation.broadcast.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {participation.role}
                          </Badge>
                          <Badge className={getStatusBadge(participation.broadcast.status)}>
                            {participation.broadcast.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(participation.broadcast.startTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No broadcast participation yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwnProfile || isAdmin ? (
                <div className="space-y-4">
                  {staff.emergencyContact ? (
                    <div>
                      <h4 className="font-medium mb-2">Emergency Contact</h4>
                      <p className="text-sm text-muted-foreground">{staff.emergencyContact}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No emergency contact information provided</p>
                  )}
                  {staff.salary && isAdmin && (
                    <div>
                      <h4 className="font-medium mb-2">Salary Information</h4>
                      <p className="text-sm text-muted-foreground">
                        ${staff.salary.toLocaleString()} per year
                      </p>
                    </div>
                  )}
                  {staff.endDate && (
                    <div>
                      <h4 className="font-medium mb-2">End Date</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(staff.endDate)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Emergency contact information is only visible to the staff member and administrators.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}