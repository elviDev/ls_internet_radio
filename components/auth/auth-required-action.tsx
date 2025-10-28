"use client"

import { type ReactNode, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AuthRequiredActionProps {
  children: ReactNode
  onAction: () => void
  dialogTitle?: string
  dialogDescription?: string
}

export function AuthRequiredAction({
  children,
  onAction,
  dialogTitle = "Authentication Required",
  dialogDescription = "You need to be signed in to perform this action.",
}: AuthRequiredActionProps) {
  const { user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (user) {
      // User is authenticated, perform the action
      onAction()
    } else {
      // User is not authenticated, show the dialog
      setShowDialog(true)
    }
  }

  const handleLogin = () => {
    router.push("/signin")
  }

  return (
    <>
      <div onClick={handleClick}>{children}</div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogin}>Sign In</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
