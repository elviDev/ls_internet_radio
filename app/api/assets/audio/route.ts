import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const genre = searchParams.get('genre') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      type: 'AUDIO'
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ])

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audio assets:', error)
    return NextResponse.json({ error: 'Failed to fetch audio assets' }, { status: 500 })
  }
}

async function getDefaultStaffId(): Promise<string> {
  // Get the first available staff member or create a default one
  const staff = await prisma.staff.findFirst({
    where: { isActive: true }
  })
  
  if (staff) {
    return staff.id
  }
  
  // Create a default staff member for uploads
  const defaultStaff = await prisma.staff.create({
    data: {
      email: 'system@radio.com',
      password: 'temp-password',
      firstName: 'System',
      lastName: 'User',
      username: 'system',
      role: 'ADMIN',
      isActive: true,
      isApproved: true
    }
  })
  
  return defaultStaff.id
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const genre = formData.get('genre') as string
    const audioType = formData.get('audioType') as string || 'music'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filepath = path.join(uploadsDir, filename)
    const publicPath = `/uploads/audio/${filename}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const asset = await prisma.asset.create({
      data: {
        filename,
        originalName: file.name,
        type: 'AUDIO',
        url: publicPath,
        size: file.size,
        mimeType: file.type,
        description: title || file.name,
        tags: JSON.stringify({
          title: title || file.name.replace(extension, ''),
          artist: artist || 'Unknown Artist',
          genre: genre || 'Unknown',
          audioType,
          duration: 180,
          format: file.type
        }),
        uploadedById: await getDefaultStaffId()
      }
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Error uploading audio asset:', error)
    return NextResponse.json({ error: 'Failed to upload audio asset' }, { status: 500 })
  }
}