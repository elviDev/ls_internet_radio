import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { rating, comment } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!existingReview || existingReview.user.email !== user.email) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment },
      include: {
        user: {
          select: { id: true, name: true, email: true, profileImage: true }
        }
      }
    })

    return NextResponse.json({ review })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!existingReview || existingReview.user.email !== user.email) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.review.delete({
      where: { id: reviewId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}