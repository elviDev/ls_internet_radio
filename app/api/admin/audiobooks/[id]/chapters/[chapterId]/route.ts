import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminOnly } from '@/lib/auth/adminOnly'

export const GET = adminOnly(async (req: NextRequest, { params }: { params: Promise<{ id: string; chapterId: string }> }) => {
  try {
    const { id, chapterId } = await params
    
    const chapter = await prisma.chapter.findUnique({
      where: { 
        id: chapterId,
        audiobookId: id
      },
      include: {
        audiobook: {
          select: {
            id: true,
            title: true,
            narrator: true
          }
        }
      }
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, chapterId } = await params
    const body = await request.json()
    const { title, audioFile, duration, trackNumber, description, transcript, status } = body

    const updateData: any = {}
    if (title) updateData.title = title
    if (audioFile) updateData.audioFile = audioFile
    if (duration) updateData.duration = duration
    if (trackNumber) updateData.trackNumber = trackNumber
    if (description) updateData.description = description
    if (transcript) updateData.transcript = transcript
    if (status) updateData.status = status.toUpperCase()

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData
    })

    // Update audiobook total duration if duration changed
    if (duration) {
      const totalDuration = await prisma.chapter.aggregate({
        where: { audiobookId: id },
        _sum: { duration: true }
      })

      await prisma.audiobook.update({
        where: { id },
        data: { duration: totalDuration._sum.duration || 0 }
      })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error updating chapter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, chapterId } = await params
    await prisma.chapter.delete({
      where: { id: chapterId }
    })

    // Update audiobook total duration
    const totalDuration = await prisma.chapter.aggregate({
      where: { audiobookId: id },
      _sum: { duration: true }
    })

    await prisma.audiobook.update({
      where: { id },
      data: { duration: totalDuration._sum.duration || 0 }
    })

    return NextResponse.json({ message: 'Chapter deleted successfully' })
  } catch (error) {
    console.error('Error deleting chapter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}