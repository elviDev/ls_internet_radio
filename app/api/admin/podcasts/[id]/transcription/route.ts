import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// POST /api/admin/podcasts/[id]/transcription - Create or update transcription
export const POST = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const { content, language = "en", format = "plain_text" } = await req.json()

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // Check if podcast exists
    const podcast = await prisma.podcast.findUnique({
      where: { id: params.id }
    })

    if (!podcast) {
      return NextResponse.json(
        { error: "Podcast not found" },
        { status: 404 }
      )
    }

    // Create or update transcription
    const transcription = await prisma.transcription.upsert({
      where: { podcastId: params.id },
      update: {
        content,
        language,
        format
      },
      create: {
        content,
        language,
        format,
        podcastId: params.id
      }
    })

    return NextResponse.json(transcription)
  } catch (error) {
    console.error("Error saving transcription:", error)
    return NextResponse.json(
      { error: "Failed to save transcription" },
      { status: 500 }
    )
  }
})

// GET /api/admin/podcasts/[id]/transcription - Get transcription
export const GET = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const transcription = await prisma.transcription.findUnique({
      where: { podcastId: params.id }
    })

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transcription)
  } catch (error) {
    console.error("Error fetching transcription:", error)
    return NextResponse.json(
      { error: "Failed to fetch transcription" },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/podcasts/[id]/transcription - Delete transcription
export const DELETE = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    await prisma.transcription.delete({
      where: { podcastId: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transcription:", error)
    return NextResponse.json(
      { error: "Failed to delete transcription" },
      { status: 500 }
    )
  }
})