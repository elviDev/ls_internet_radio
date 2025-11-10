"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Activity,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit,
  UserX,
  UserCheck,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  name?: string
  username?: string
  profileImage?: string
  isActive: boolean
  isSuspended: boolean
  suspendedAt?: string
  suspendedReason?: string
  emailVerified: boolean
  emailVerifiedAt?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  _count?: {
    reviews: number
    comments: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        toast.error("User not found")
        router.push("/dashboard/users")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast.error("Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async (suspend: boolean) => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuspended: suspend,
          suspendedReason: suspend ? "Suspended by admin" : undefined
        })
      })

      if (response.ok) {
        toast.success(`User ${suspend ? "suspended" : "unsuspended"} successfully`)
        fetchUser()
      } else {
        toast.error("Failed to update user")
      }
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  const handleDeleteUser = async () => {
    if (!user || !confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("User deleted successfully")
        router.push("/dashboard/users")
      } else {
        toast.error("Failed to delete user")
      }
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      }
      return name.charAt(0).toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || "U"
  }

  const getFirstName = (name?: string) => {
    return name?.split(' ')[0] || 'Not set'
  }

  const getLastName = (name?: string) => {
    const parts = name?.split(' ') || []
    return parts.length > 1 ? parts.slice(1).join(' ') : 'Not set'
  }

  const getStatusBadge = () => {
    if (!user) return null

    if (user.isSuspended) {
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          Suspended
        </Badge>
      )
    }
    if (!user.isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Inactive
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {user.isSuspended ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuspendUser(false)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Unsuspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuspendUser(true)}
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteUser}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profileImage} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-semibold">
                    {user.name || "No name set"}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  {getStatusBadge()}
                  <Badge
                    variant={user.emailVerified ? "default" : "destructive"}
                    className={
                      user.emailVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {user.emailVerified ? "Email Verified" : "Email Unverified"}
                  </Badge>
                </div>

                {user.isSuspended && user.suspendedReason && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Suspension Reason:</p>
                    <p className="text-sm text-red-700">{user.suspendedReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm">{user.username || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <p className="text-sm">{getFirstName(user.name)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <p className="text-sm">{getLastName(user.name)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined</label>
                    <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-sm">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
                {user.emailVerifiedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                      <p className="text-sm">{new Date(user.emailVerifiedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {user.suspendedAt && (
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Suspended</label>
                      <p className="text-sm">{new Date(user.suspendedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reviews</label>
                    <p className="text-sm">{user._count?.reviews || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Comments</label>
                    <p className="text-sm">{user._count?.comments || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}