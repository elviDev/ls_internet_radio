import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { z } from "zod"

const createEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  airDate: z.string().datetime(),
  broadcastId: z.string().optional()
})

// GET /api/admin/programs/[id]/episodes - Get all episodes for a program
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    
    const episodes = await prisma.programEpisode.findMany({
      where: { programId: id },
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
      },
      orderBy: { airDate: "desc" }
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

// POST /api/admin/programs/[id]/episodes - Create new episode
export const POST = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createEpisodeSchema.parse(body)

    // Verify the program exists
    const program = await prisma.program.findUnique({
      where: { id }
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    // If linking to a broadcast, verify it exists and is not already linked
    if (data.broadcastId) {
      const broadcast = await prisma.liveBroadcast.findUnique({
        where: { id: data.broadcastId },
        include: { episode: true }
      })

      if (!broadcast) {
        return NextResponse.json(
          { error: "Broadcast not found" },
          { status: 404 }
        )
      }

      if (broadcast.episode) {
        return NextResponse.json(
          { error: "Broadcast is already linked to an episode" },
          { status: 400 }
        )
      }

      // Update the broadcast to link it to this program
      await prisma.liveBroadcast.update({
        where: { id: data.broadcastId },
        data: { programId: id }
      })
    }

    const episode = await prisma.programEpisode.create({
      data: {
        title: data.title,
        description: data.description,
        airDate: new Date(data.airDate),
        programId: id,
        broadcastId: data.broadcastId
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