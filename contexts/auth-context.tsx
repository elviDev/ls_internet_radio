"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  profilePicture?: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
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
  const router = useRouter()

  // Fetch current user on mount
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user || null)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Failed to load user session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromSession()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" }
      }

      setUser(data.user)
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" }
      }

      setUser(data.user)
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.refresh()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
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
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
