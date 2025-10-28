import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminOnly } from '@/lib/auth/adminOnly'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transcription = await prisma.transcription.findUnique({
      where: { audiobookId: params.id }
    })

    return NextResponse.json(transcription)
  } catch (error) {
    console.error('Error fetching transcription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, language = 'en', format = 'plain_text' } = body

    const transcription = await prisma.transcription.upsert({
      where: { audiobookId: params.id },
      update: {
        content,
        language,
        format,
        lastEditedBy: user.id,
        lastEditedAt: new Date()
      },
      create: {
        content,
        language,
        format,
        audiobookId: params.id,
        lastEditedBy: user.id,
        lastEditedAt: new Date()
      }
    })

    return NextResponse.json(transcription)
  } catch (error) {
    console.error('Error saving transcription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await adminOnly()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, language, format, isEditable } = body

    const updateData: any = {
      lastEditedBy: user.id,
      lastEditedAt: new Date()
    }

    if (content) updateData.content = content
    if (language) updateData.language = language
    if (format) updateData.format = format
    if (isEditable !== undefined) updateData.isEditable = isEditable

    const transcription = await prisma.transcription.update({
      where: { audiobookId: params.id },
      data: updateData
    })

    return NextResponse.json(transcription)
  } catch (error) {
    console.error('Error updating transcription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}