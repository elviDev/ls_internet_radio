import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { z } from "zod"

const updateEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  transcript: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  duration: z.number().min(0).optional()
})

async function uploadFileAsAsset(file: File, description: string, tags: string, uploadedById: string) {
  const uploadDir = join(process.cwd(), "public", "uploads", "assets");
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

  const asset = await prisma.asset.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      type: file.type.startsWith('audio/') ? 'AUDIO' : 'DOCUMENT',
      url: `/uploads/assets/${filename}`,
      description,
      tags,
      uploadedById,
    },
  });

  return asset;
}

// GET /api/admin/podcasts/[id]/episodes/[episodeId] - Get single episode
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params
    
    const episode = await prisma.podcastEpisode.findFirst({
      where: { 
        id: episodeId,
        podcastId: id
      },
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            host: true
          }
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(episode)
  } catch (error) {
    console.error("Error fetching episode:", error)
    return NextResponse.json(
      { error: "Failed to fetch episode" },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/podcasts/[id]/episodes/[episodeId] - Update episode
export const PATCH = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if it's form data (for transcript file upload) or JSON (for basic updates)
    const contentType = req.headers.get('content-type')
    let data: any = {}

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data for transcript uploads
      const formData = await req.formData()
      
      const title = formData.get("title") as string
      const description = formData.get("description") as string
      const status = formData.get("status") as string
      const transcript = formData.get("transcript") as string
      const transcriptFile = formData.get("transcriptFile") as File

      if (title) data.title = title
      if (description !== undefined) data.description = description
      if (status) data.status = status
      if (transcript !== undefined) data.transcript = transcript

      // Handle transcript file upload
      if (transcriptFile && transcriptFile.size > 0) {
        const transcriptAsset = await uploadFileAsAsset(
          transcriptFile,
          `Transcript for episode`,
          'podcast,episode,transcript',
          user.id
        )
        data.transcriptFile = transcriptAsset.url
      }
    } else {
      // Handle JSON updates
      const body = await req.json()
      data = updateEpisodeSchema.parse(body)
    }

    // Verify episode belongs to this podcast
    const existingEpisode = await prisma.podcastEpisode.findFirst({
      where: { 
        id: episodeId,
        podcastId: id
      }
    })

    if (!existingEpisode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.transcript !== undefined) updateData.transcript = data.transcript
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === "PUBLISHED" && !existingEpisode.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const episode = await prisma.podcastEpisode.update({
      where: { id: episodeId },
      data: updateData,
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            host: true
          }
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    return NextResponse.json(episode)
  } catch (error) {
    console.error("Update episode error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update episode" }, { status: 500 })
  }
})

// DELETE /api/admin/podcasts/[id]/episodes/[episodeId] - Delete episode
export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params

    // Verify episode belongs to this podcast
    const existingEpisode = await prisma.podcastEpisode.findFirst({
      where: { 
        id: episodeId,
        podcastId: id
      }
    })

    if (!existingEpisode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      )
    }

    // Delete the episode (related records will be cascade deleted)
    await prisma.podcastEpisode.delete({
      where: { id: episodeId }
    })

    return NextResponse.json({ message: "Episode deleted successfully" })
  } catch (error) {
    console.error("Delete episode error:", error)
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 })
  }
})