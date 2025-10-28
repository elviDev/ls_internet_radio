import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { z } from "zod"

const updateEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  airDate: z.string().datetime().optional(),
  audioFile: z.string().optional()
})

// GET /api/admin/programs/[id]/episodes/[episodeId] - Get single episode
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params
    
    const episode = await prisma.programEpisode.findFirst({
      where: { 
        id: episodeId,
        programId: id
      },
      include: {
        broadcast: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            recordingUrl: true
          }
        },
        program: {
          select: {
            id: true,
            title: true
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

// PATCH /api/admin/programs/[id]/episodes/[episodeId] - Update episode
export const PATCH = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params
    const body = await req.json()
    const data = updateEpisodeSchema.parse(body)

    // Verify episode belongs to this program
    const existingEpisode = await prisma.programEpisode.findFirst({
      where: { 
        id: episodeId,
        programId: id
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
    if (data.airDate !== undefined) updateData.airDate = new Date(data.airDate)
    if (data.audioFile !== undefined) updateData.audioFile = data.audioFile

    const episode = await prisma.programEpisode.update({
      where: { id: episodeId },
      data: updateData,
      include: {
        broadcast: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            recordingUrl: true
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

// DELETE /api/admin/programs/[id]/episodes/[episodeId] - Delete episode
export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string, episodeId: string }> }) => {
  try {
    const { id, episodeId } = await params

    // Verify episode belongs to this program
    const existingEpisode = await prisma.programEpisode.findFirst({
      where: { 
        id: episodeId,
        programId: id
      },
      include: {
        broadcast: true
      }
    })

    if (!existingEpisode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      )
    }

    // If this episode is linked to a broadcast, unlink it
    if (existingEpisode.broadcastId) {
      await prisma.liveBroadcast.update({
        where: { id: existingEpisode.broadcastId },
        data: { programId: null }
      })
    }

    // Delete the episode
    await prisma.programEpisode.delete({
      where: { id: episodeId }
    })

    return NextResponse.json({ message: "Episode deleted successfully" })
  } catch (error) {
    console.error("Delete episode error:", error)
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 })
  }
})