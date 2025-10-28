import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminOnly } from '@/lib/auth/adminOnly'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(request: NextRequest) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '12')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const genre = searchParams.get('genre') || 'all'
    const author = searchParams.get('author') || 'all'
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * perPage

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { narrator: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { createdBy: { firstName: { contains: search, mode: 'insensitive' } } },
        { createdBy: { lastName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (genre !== 'all') {
      where.genreId = genre
    }

    if (author !== 'all') {
      where.createdById = author
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [audiobooks, total] = await Promise.all([
      prisma.audiobook.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
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
              favorites: true,
              playbackProgress: true
            }
          }
        }
      }),
      prisma.audiobook.count({ where })
    ])

    const audiobooksWithStats = await Promise.all(
      audiobooks.map(async (audiobook) => {
        const avgRating = await prisma.review.aggregate({
          where: { audiobookId: audiobook.id },
          _avg: { rating: true }
        })

        return {
          ...audiobook,
          averageRating: avgRating._avg.rating || 0,
          totalPlays: audiobook.playCount
        }
      })
    )

    return NextResponse.json({
      audiobooks: audiobooksWithStats,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error('Error fetching audiobooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      language = 'en',
      tags,
      price,
      currency = 'USD',
      isExclusive = false,
      releaseDate
    } = body

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const audiobook = await prisma.audiobook.create({
      data: {
        title,
        slug,
        author,
        narrator,
        description,
        coverImage,
        duration: 0, // Will be calculated when chapters are added
        releaseDate: new Date(releaseDate),
        createdById: user.id,
        genreId,
        isbn,
        publisher,
        language,
        tags: tags ? JSON.stringify(tags) : null,
        price,
        currency,
        isExclusive
      },
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

    return NextResponse.json(audiobook, { status: 201 })
  } catch (error) {
    console.error('Error creating audiobook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}