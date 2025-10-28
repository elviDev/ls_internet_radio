"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Radio } from "lucide-react"

export default function StudioRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/broadcasts')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Radio className="h-16 w-16 text-slate-400" />
          </div>
          <CardTitle>Studio Has Moved!</CardTitle>
          <CardDescription>
            The studio is now integrated within each broadcast. You'll find the studio controls when you select a specific broadcast.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            To access the studio:
          </p>
          <ol className="text-sm text-left list-decimal list-inside space-y-1 text-slate-600">
            <li>Go to the Broadcasts page</li>
            <li>Select or create a broadcast</li>
            <li>Click "Go Live" or "Enter Studio"</li>
          </ol>
          
          <div className="pt-4">
            <Button 
              onClick={() => router.push('/dashboard/broadcasts')}
              className="w-full"
            >
              Go to Broadcasts
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <p className="text-xs text-slate-500">
            Redirecting automatically in 3 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}