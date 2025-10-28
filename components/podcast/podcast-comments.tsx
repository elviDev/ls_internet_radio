"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { AuthRequiredAction } from "@/components/auth/auth-required-action"

interface Comment {
  id: string
  author: string
  authorImage?: string
  content: string
  date: string
}

interface PodcastCommentsProps {
  initialComments: Comment[]
  episodeId?: string
  onAddComment?: (content: string) => Promise<{ success: boolean }>
  isLoading?: boolean
  className?: string
}

export function PodcastComments({ 
  initialComments, 
  episodeId, 
  onAddComment,
  isLoading = false,
  className 
}: PodcastCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Update comments when initialComments change
  React.useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !episodeId) return

    if (!onAddComment) {
      toast({
        title: "Error",
        description: "Comments not available for this episode",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onAddComment(newComment)
      if (result.success) {
        setNewComment("")
      }
    } catch (error) {
      // Error handling is done in the onAddComment function
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    }
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6">Comments</h2>

      <form onSubmit={handleSubmitComment} className="mb-8">
        <Textarea
          placeholder={user ? "Add a comment..." : "Sign in to add a comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
          disabled={!user}
        />
        {user ? (
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        ) : (
          <AuthRequiredAction onAction={() => {}}>
            <Button type="button">Sign in to Comment</Button>
          </AuthRequiredAction>
        )}
      </form>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            <p className="text-muted-foreground mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {episodeId ? "No comments yet. Be the first to comment!" : "Select an episode to view comments"}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={comment.authorImage || "/placeholder.svg?height=100&width=100"} />
                <AvatarFallback>
                  {comment.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{comment.author}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.date)}</p>
                </div>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
