import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    
    const reviews = await prisma.review.findMany({
      where: { audiobookId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
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

    // Check if user already reviewed this audiobook
    const existingReview = await prisma.review.findFirst({
      where: {
        audiobookId: id,
        OR: [
          { userId: user.id },
          { user: { email: user.email } }
        ]
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this audiobook' },
        { status: 400 }
      )
    }

    // Find or create user record for reviews
    let actualUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    // If user doesn't exist and this is a staff member, create a user record
    if (!actualUser && user.role) {
      actualUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          password: 'staff_user' // Placeholder since staff login separately
        }
      })
    }

    if (!actualUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId: actualUser.id,
        audiobookId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      }
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}