"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  CheckCircle, 
  XCircle,
  Loader2,
  Radio,
  Users,
  ArrowRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type GuestInvitation = {
  id: string
  podcastId: string
  guestName: string
  guestEmail: string
  invitationToken: string
  status: string
  expiresAt: string
  createdAt: string
  podcast: {
    id: string
    title: string
    description: string
    host: string
    releaseDate: string
    duration: number
    coverImage?: string
  }
}

export default function GuestJoinPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invitation, setInvitation] = useState<GuestInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [hasAccount, setHasAccount] = useState<boolean | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")

  useEffect(() => {
    if (params.token) {
      fetchInvitation()
    }
  }, [params.token])

  const fetchInvitation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/guest/invitations/${params.token}`)
      
      if (!response.ok) {
        throw new Error('Invalid or expired invitation')
      }
      
      const data = await response.json()
      setInvitation(data)
      setSignupName(data.guestName)
      setSignupEmail(data.guestEmail)
      setLoginEmail(data.guestEmail)
    } catch (error: any) {
      toast({
        title: "Invalid Invitation",
        description: error.message || "This invitation link is invalid or has expired",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      setJoining(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      // Accept invitation and redirect to podcast session
      await acceptInvitation()
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setJoining(false)
    }
  }

  const handleSignup = async () => {
    try {
      setJoining(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      // Accept invitation and redirect to podcast session
      await acceptInvitation()
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setJoining(false)
    }
  }

  const acceptInvitation = async () => {
    try {
      const response = await fetch(`/api/guest/invitations/${params.token}/accept`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to accept invitation')
      }

      toast({
        title: "Welcome!",
        description: "You've successfully joined the podcast session"
      })

      // Redirect to podcast session
      router.push(`/podcasts/${invitation?.podcastId}/session`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join podcast session",
        variant: "destructive"
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-center mb-6">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-muted-foreground text-center mb-6">
              This invitation has expired. Please contact the podcast host for a new invitation.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Radio className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Podcast Invitation</h1>
          </div>
          <p className="text-muted-foreground">You've been invited to join a podcast session</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Podcast Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Podcast Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Podcast Cover & Title */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={invitation.podcast.coverImage || "/placeholder.svg"}
                    alt={invitation.podcast.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{invitation.podcast.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {invitation.podcast.description}
                  </p>
                </div>
              </div>

              {/* Podcast Meta */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hosted by:</span>
                  <span className="font-medium">{invitation.podcast.host}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Release Date:</span>
                  <span className="font-medium">
                    {new Date(invitation.podcast.releaseDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formatDuration(invitation.podcast.duration)}</span>
                </div>
              </div>

              {/* Invitation Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">You're Invited!</span>
                </div>
                <p className="text-sm text-green-700">
                  Hello <strong>{invitation.guestName}</strong>, you've been invited to participate as a guest in this podcast episode.
                </p>
              </div>

              {/* Expiration Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Invitation Expires</span>
                </div>
                <p className="text-sm text-orange-700">
                  {new Date(invitation.expiresAt).toLocaleDateString()} at {new Date(invitation.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Join Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join the Session
              </CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to join the podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasAccount === null && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Do you already have an account with us?
                  </p>
                  <div className="grid gap-3">
                    <Button onClick={() => setHasAccount(true)} variant="outline" className="w-full">
                      Yes, I have an account
                    </Button>
                    <Button onClick={() => setHasAccount(false)} className="w-full">
                      No, create new account
                    </Button>
                  </div>
                </div>
              )}

              {hasAccount === true && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Sign In</h4>
                    <Button variant="ghost" size="sm" onClick={() => setHasAccount(null)}>
                      Back
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="loginEmail">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginPassword">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <Button onClick={handleLogin} disabled={joining} className="w-full">
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In & Join
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {hasAccount === false && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Create Account</h4>
                    <Button variant="ghost" size="sm" onClick={() => setHasAccount(null)}>
                      Back
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="signupName">Full Name</Label>
                      <Input
                        id="signupName"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a password"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSignup} disabled={joining} className="w-full">
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account & Join
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our terms of service and privacy policy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}