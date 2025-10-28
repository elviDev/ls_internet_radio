"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Radio, AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react"

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [isResending, setIsResending] = useState(false)
  
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus("error")
      setMessage("Invalid or missing verification token")
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await res.json()

      if (res.ok) {
        setStatus("success")
        setMessage("Your email has been successfully verified!")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to verify email")
      }
    } catch (err) {
      setStatus("error")
      setMessage("An unexpected error occurred")
    }
  }

  const resendVerification = async () => {
    setIsResending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("A new verification email has been sent to your email address")
      } else {
        setMessage(data.error || "Failed to resend verification email")
      }
    } catch (err) {
      setMessage("Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <Radio className="h-8 w-8 text-brand-600" />
              <span className="font-bold text-2xl">WaveStream</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-brand-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <Radio className="h-8 w-8 text-brand-600" />
              <span className="font-bold text-2xl">WaveStream</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Your account is now active. You can sign in and start using WaveStream.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-brand-600 hover:bg-brand-700">
                <Link href="/signin">
                  Sign In
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Radio className="h-8 w-8 text-brand-600" />
            <span className="font-bold text-2xl">WaveStream</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message.includes("expired") && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your verification link has expired. You can request a new one below.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full space-y-2">
              <Button
                onClick={resendVerification}
                disabled={isResending}
                className="w-full bg-brand-600 hover:bg-brand-700"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signin">
                  Back to Sign In
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}