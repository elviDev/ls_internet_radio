import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const audiobook = await prisma.audiobook.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        chapters: {
          orderBy: { trackNumber: 'asc' }
        },
        transcription: true,
        _count: {
          select: {
            chapters: true,
            comments: true,
            reviews: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    if (!audiobook) {
      return NextResponse.json({ error: 'Audiobook not found' }, { status: 404 })
    }

    const avgRating = await prisma.review.aggregate({
      where: { audiobookId: audiobook.id },
      _avg: { rating: true }
    })

    return NextResponse.json({
      ...audiobook,
      averageRating: avgRating._avg.rating || 0,
      totalPlays: audiobook.playCount
    })
  } catch (error) {
    console.error('Error fetching audiobook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const {
      title,
      author,
      narrator,
      description,
      coverImage,
      genreId,
      isbn,
      publisher,
      language,
      tags,
      price,
      currency,
      isExclusive,
      releaseDate,
      status
    } = body

    const updateData: any = {}

    if (title) {
      updateData.title = title
      updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (author !== undefined) updateData.author = author
    if (narrator) updateData.narrator = narrator
    if (description) updateData.description = description
    if (coverImage) updateData.coverImage = coverImage
    if (genreId) updateData.genreId = genreId
    if (isbn) updateData.isbn = isbn
    if (publisher) updateData.publisher = publisher
    if (language) updateData.language = language
    if (tags) updateData.tags = JSON.stringify(tags)
    if (price !== undefined) updateData.price = price
    if (currency) updateData.currency = currency
    if (isExclusive !== undefined) updateData.isExclusive = isExclusive
    if (releaseDate) updateData.releaseDate = new Date(releaseDate)

    if (status) {
      updateData.status = status.toUpperCase()
      if (status.toUpperCase() === 'PUBLISHED') {
        updateData.publishedAt = new Date()
      } else if (status.toUpperCase() === 'ARCHIVED') {
        updateData.archivedAt = new Date()
      }
    }

    const audiobook = await prisma.audiobook.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            chapters: true,
            comments: true,
            reviews: true,
            favorites: true
          }
        }
      }
    })

    return NextResponse.json(audiobook)
  } catch (error) {
    console.error('Error updating audiobook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.audiobook.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Audiobook deleted successfully' })
  } catch (error) {
    console.error('Error deleting audiobook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}