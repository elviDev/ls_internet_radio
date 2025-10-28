"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Edit, Trash2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    profileImage?: string
  }
}

interface ReviewSectionProps {
  audiobookId?: string
  podcastId?: string
  currentUserId?: string
}

export function ReviewSection({ audiobookId, podcastId, currentUserId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  const contentId = audiobookId || podcastId
  const contentType = audiobookId ? 'audiobooks' : 'podcasts'

  useEffect(() => {
    fetchReviews()
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

  const fetchReviews = async () => {
    if (!contentId) return
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!rating || !contentId) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Review submitted:', data.review)
        setReviews(prev => [data.review, ...prev])
        setRating(0)
        setComment("")
        setShowReviewForm(false)
        toast({
          title: "Success",
          description: "Review submitted successfully"
        })
      } else {
        const error = await response.json()
        console.error('Review submission error:', error)
        toast({
          title: "Error",
          description: error.error || "Failed to submit review",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateReview = async () => {
    if (!editingReview || !rating) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(reviews.map(r => r.id === editingReview.id ? data.review : r))
        setEditingReview(null)
        setShowEditDialog(false)
        setRating(0)
        setComment("")
        toast({
          title: "Success",
          description: "Review updated successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId))
        toast({
          title: "Success",
          description: "Review deleted successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive"
      })
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    )
  }

  // Match reviews by email since staff might have different user records
  const currentUserEmail = currentUser?.email
  const userReview = reviews.find(r => {
    if (currentUser?.email) {
      // For logged in users, match by email from the user record
      return r.user.email === currentUser.email || r.user.id === currentUser.id
    }
    return r.user.id === currentUserId
  })
  const otherReviews = reviews.filter(r => {
    if (currentUser?.email) {
      return r.user.email !== currentUser.email && r.user.id !== currentUser.id
    }
    return r.user.id !== currentUserId
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
        {(currentUser || currentUserId) && !userReview && (
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button>Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  {renderStars(rating, true, setRating)}
                </div>
                <div>
                  <label className="text-sm font-medium">Comment (optional)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Share your thoughts about this ${audiobookId ? 'audiobook' : 'podcast'}...`}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={submitReview} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {userReview && (
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userReview.user.profileImage} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Your Review</p>
                  {renderStars(userReview.rating)}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingReview(userReview)
                        setRating(userReview.rating)
                        setComment(userReview.comment || "")
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        {renderStars(rating, true, setRating)}
                      </div>
                      <div>
                        <label className="text-sm font-medium">Comment</label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={updateReview} disabled={submitting}>
                          {submitting ? "Updating..." : "Update Review"}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setEditingReview(null)
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
                  onClick={() => deleteReview(userReview.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {userReview.comment && (
            <CardContent className="pt-0">
              <p className="text-muted-foreground">{userReview.comment}</p>
            </CardContent>
          )}
        </Card>
      )}

      <div className="space-y-4">
        {otherReviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.user.profileImage} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{review.user.name || "Anonymous"}</p>
                  {renderStars(review.rating)}
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            {review.comment && (
              <CardContent className="pt-0">
                <p className="text-muted-foreground">{review.comment}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  )
}