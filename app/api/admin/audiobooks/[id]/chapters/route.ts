import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { adminOnly } from '@/lib/auth/adminOnly'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'

const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  duration: z.number().min(1, "Duration is required"),
  trackNumber: z.number().min(1, "Track number is required"),
  description: z.string().optional(),
  transcript: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT")
})

async function uploadAudioFile(file: File, uploadedById: string) {
  const uploadDir = join(process.cwd(), "public", "uploads", "chapters");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const filename = `${timestamp}-${random}.${extension}`;
  const filepath = join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  return `/uploads/chapters/${filename}`;
}

export const GET = adminOnly(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    
    const chapters = await prisma.chapter.findMany({
      where: { audiobookId: id },
      orderBy: { trackNumber: 'asc' }
    })

    return NextResponse.json(chapters)
  } catch (error) {
    console.error('Error fetching chapters:', error)
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 })
  }
})

export const POST = adminOnly(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify audiobook exists
    const audiobook = await prisma.audiobook.findUnique({
      where: { id },
      include: {
        chapters: {
          select: { trackNumber: true },
          orderBy: { trackNumber: 'desc' },
          take: 1
        }
      }
    })

    if (!audiobook) {
      return NextResponse.json({ error: 'Audiobook not found' }, { status: 404 })
    }

    const formData = await req.formData()
    
    const title = formData.get('title') as string
    const duration = parseInt(formData.get('duration') as string)
    const trackNumber = parseInt(formData.get('trackNumber') as string)
    const description = formData.get('description') as string || undefined
    const transcript = formData.get('transcript') as string || undefined
    const status = (formData.get('status') as string) || 'DRAFT'
    const audioFile = formData.get('audioFile') as File

    // Validate required fields
    if (!title || !audioFile || !duration || !trackNumber) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, audioFile, duration, trackNumber' 
      }, { status: 400 })
    }

    // Validate input data
    const validatedData = createChapterSchema.parse({
      title,
      duration,
      trackNumber,
      description,
      transcript,
      status
    })

    // Check for duplicate track numbers
    const existingChapter = await prisma.chapter.findUnique({
      where: { 
        audiobookId_trackNumber: {
          audiobookId: id,
          trackNumber: validatedData.trackNumber
        }
      }
    })

    if (existingChapter) {
      return NextResponse.json({ 
        error: `Chapter with track number ${validatedData.trackNumber} already exists` 
      }, { status: 409 })
    }

    // Upload audio file
    const audioUrl = await uploadAudioFile(audioFile, user.id)

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        title: validatedData.title,
        audioFile: audioUrl,
        duration: validatedData.duration,
        trackNumber: validatedData.trackNumber,
        description: validatedData.description,
        transcript: validatedData.transcript,
        status: validatedData.status as any,
        audiobookId: id
      }
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

    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error('Error creating chapter:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to create chapter',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})