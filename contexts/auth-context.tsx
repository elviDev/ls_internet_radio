"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { FullPageLoader } from "@/components/loading-spinner"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  isApproved: boolean
  profilePicture?: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string; password?: string; currentPassword?: string }) => Promise<{
    success: boolean
    error?: string
  }>
  uploadProfilePicture: (file: File) => Promise<{ success: boolean; error?: string }>
  deleteProfilePicture: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch current user on mount
  useEffect(() => {
    async function loadUserFromSession() {
      console.log("[AuthContext] Loading user session...")
      setLoading(true)
      try {     
        const res = await fetch("/api/auth/session", {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        
        if (res.ok) {
          const data = await res.json()
          console.log("[AuthContext] Session response:", data)
          if (data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
            console.log("[AuthContext] User authenticated:", data.user.email)
          } else {
            setUser(null)
            setIsAuthenticated(false)
            console.log("[AuthContext] No user found in session")
          }
        } else {
          console.log("[AuthContext] Session check failed with status:", res.status)
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error: any) {
        console.error("[AuthContext] Failed to load user session:", error.message)
        if (error.name === 'AbortError') {
          console.error("[AuthContext] Session request timed out")
        }
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromSession()
  }, [])

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await res.json()
      console.log("Login response data:", data)

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" }
      }

      // Update state immediately
      setUser(data.user)
      setIsAuthenticated(true)
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      })
      return { success: true, user: data.user }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = "An unexpected error occurred during login"
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" }
      }

      if (data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
      }
      router.refresh()
      toast({
        title: "Account Created!",
        description: "Your account has been successfully created.",
      })
      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      const errorMessage = "An unexpected error occurred during registration"
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include'
      })
      setUser(null)
      setIsAuthenticated(false)
      router.refresh()
      router.push("/signin")
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear local state even if API call fails
      setUser(null)
      setIsAuthenticated(false)
      router.push("/signin")
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update profile function
  const updateProfile = async (data: {
    name?: string
    email?: string
    password?: string
    currentPassword?: string
  }) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (!res.ok) {
        return { success: false, error: responseData.error || "Failed to update profile" }
      }

      setUser((prev) => (prev ? { ...prev, ...responseData.user } : null))
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  // Upload profile picture function
  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/auth/profile-picture", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Failed to upload profile picture" }
      }

      setUser((prev) => (prev ? { ...prev, ...data.user } : null))
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error("Profile picture upload error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  // Delete profile picture function
  const deleteProfilePicture = async () => {
    try {
      const res = await fetch("/api/auth/profile-picture", {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Failed to delete profile picture" }
      }

      setUser((prev) => (prev ? { ...prev, ...data.user } : null))
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error("Profile picture delete error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
  }


  return (
    <AuthContext.Provider value={value}>
      {loading && <FullPageLoader text="Loading user session..." />}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
