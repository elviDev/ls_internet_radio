"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, User, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    profileImage?: string
  }
}

interface CommentSectionProps {
  audiobookId?: string
  podcastId?: string
  currentUserId?: string
}

export function CommentSection({ audiobookId, podcastId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState("")
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  const contentId = audiobookId || podcastId
  const contentType = audiobookId ? 'audiobooks' : 'podcasts'

  useEffect(() => {
    fetchComments()
    fetchCurrentUser()
  }, [contentId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchComments = async () => {
    if (!contentId) return
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!content.trim() || !contentId) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setContent("")
        setShowCommentForm(false)
        toast({
          title: "Success",
          description: "Comment added successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add comment",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateComment = async () => {
    if (!editingComment || !content.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/comments/${editingComment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c => c.id === editingComment.id ? data.comment : c))
        setEditingComment(null)
        setShowEditDialog(false)
        setContent("")
        toast({
          title: "Success",
          description: "Comment updated successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast({
          title: "Success",
          description: "Comment deleted successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  const canEditComment = (comment: Comment) => {
    if (currentUser?.email) {
      return comment.user.email === currentUser.email || comment.user.id === currentUser.id
    }
    return comment.user.id === currentUserId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
        {(currentUser || currentUserId) && (
          <Dialog open={showCommentForm} onOpenChange={setShowCommentForm}>
            <DialogTrigger asChild>
              <Button>Add Comment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Comment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Share your thoughts about this ${audiobookId ? 'audiobook' : 'podcast'}...`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={submitComment} disabled={submitting}>
                    {submitting ? "Adding..." : "Add Comment"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCommentForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profileImage} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{comment.user.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {canEditComment(comment) && (
                  <div className="flex gap-2">
                    <Dialog open={showEditDialog && editingComment?.id === comment.id} onOpenChange={(open) => {
                      setShowEditDialog(open)
                      if (!open) setEditingComment(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingComment(comment)
                            setContent(comment.content)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Comment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button onClick={updateComment} disabled={submitting}>
                              {submitting ? "Updating..." : "Update Comment"}
                            </Button>
                            <Button variant="outline" onClick={() => {
                              setEditingComment(null)
                              setShowEditDialog(false)
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}