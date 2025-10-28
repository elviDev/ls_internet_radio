import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminOnly } from '@/lib/auth/adminOnly'

export async function GET() {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      total,
      published,
      draft,
      archived,
      totalChapters,
      totalDuration,
      totalPlays,
      avgRating,
      topGenres
    ] = await Promise.all([
      prisma.audiobook.count(),
      prisma.audiobook.count({ where: { status: 'PUBLISHED' } }),
      prisma.audiobook.count({ where: { status: 'DRAFT' } }),
      prisma.audiobook.count({ where: { status: 'ARCHIVED' } }),
      prisma.chapter.count(),
      prisma.audiobook.aggregate({
        _sum: { duration: true }
      }),
      prisma.audiobook.aggregate({
        _sum: { playCount: true }
      }),
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
      prisma.genre.findMany({
        include: {
          _count: {
            select: { audiobooks: true }
          }
        },
        orderBy: {
          audiobooks: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ])

    return NextResponse.json({
      total,
      published,
      draft,
      archived,
      totalChapters,
      totalDuration: totalDuration._sum.duration || 0,
      totalPlays: totalPlays._sum.playCount || 0,
      averageRating: avgRating._avg.rating || 0,
      topGenres: topGenres.map(genre => ({
        name: genre.name,
        count: genre._count.audiobooks
      }))
    })
  } catch (error) {
    console.error('Error fetching audiobook stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}