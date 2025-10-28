import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { z } from "zod"

const createEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  transcript: z.string().optional()
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

// GET /api/admin/podcasts/[id]/episodes - Get all episodes for a podcast
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    
    const episodes = await prisma.podcastEpisode.findMany({
      where: { podcastId: id },
      orderBy: { episodeNumber: "asc" },
      include: {
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    return NextResponse.json(episodes)
  } catch (error) {
    console.error("Error fetching episodes:", error)
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    )
  }
})

// POST /api/admin/podcasts/[id]/episodes - Create new episode
export const POST = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const transcript = formData.get("transcript") as string
    const audioFile = formData.get("audioFile") as File
    const transcriptFile = formData.get("transcriptFile") as File
    const audioAssetId = formData.get("audioAssetId") as string
    const duration = parseInt(formData.get("duration") as string || "0")

    if (!title || (!audioFile && !audioAssetId)) {
      return NextResponse.json(
        { error: "Title and audio file are required" },
        { status: 400 }
      )
    }

    // Verify the podcast exists
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: {
        episodes: {
          select: { episodeNumber: true },
          orderBy: { episodeNumber: "desc" },
          take: 1
        }
      }
    })

    if (!podcast) {
      return NextResponse.json(
        { error: "Podcast not found" },
        { status: 404 }
      )
    }

    // Calculate next episode number
    const nextEpisodeNumber = podcast.episodes.length > 0 
      ? podcast.episodes[0].episodeNumber + 1 
      : 1

    // Handle audio - either use existing asset or upload new file
    let audioUrl: string
    if (audioAssetId) {
      const audioAsset = await prisma.asset.findUnique({
        where: { id: audioAssetId }
      })
      if (!audioAsset) {
        return NextResponse.json(
          { error: "Audio asset not found" },
          { status: 400 }
        )
      }
      audioUrl = audioAsset.url
    } else {
      // Upload new audio file as asset
      const audioAsset = await uploadFileAsAsset(
        audioFile,
        `Episode ${nextEpisodeNumber}: ${title}`,
        'podcast,episode,audio',
        user.id
      )
      audioUrl = audioAsset.url
    }

    // Handle transcript file if provided
    let transcriptFileUrl: string | null = null
    if (transcriptFile) {
      const transcriptAsset = await uploadFileAsAsset(
        transcriptFile,
        `Transcript for Episode ${nextEpisodeNumber}: ${title}`,
        'podcast,episode,transcript',
        user.id
      )
      transcriptFileUrl = transcriptAsset.url
    }

    // Create episode
    const episode = await prisma.podcastEpisode.create({
      data: {
        podcastId: id,
        title,
        description,
        episodeNumber: nextEpisodeNumber,
        audioFile: audioUrl,
        duration,
        transcript,
        transcriptFile: transcriptFileUrl,
        status: "DRAFT"
      },
      include: {
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error("Create episode error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create episode" }, { status: 500 })
  }
})