import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { z } from "zod"

const updateProgramSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["TALK_SHOW", "MUSIC", "TECHNOLOGY", "BUSINESS", "INTERVIEW", "SPORTS", "NEWS", "ENTERTAINMENT", "EDUCATION"]),
  schedule: z.string().min(1, "Schedule is required"),
  hostId: z.string().min(1, "Host is required"),
  genreId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  image: z.string().optional()
})

export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        genre: {
          select: { id: true, name: true }
        },
        _count: {
          select: { 
            episodes: true,
            broadcasts: true
          }
        }
      }
    })

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error("Get program error:", error)
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 })
  }
})

export const PUT = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateProgramSchema.parse(body)

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const program = await prisma.program.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        schedule: data.schedule,
        image: data.image,
        status: data.status,
        hostId: data.hostId,
        genreId: data.genreId || null
      },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        genre: {
          select: { id: true, name: true }
        },
        _count: {
          select: { 
            episodes: true,
            broadcasts: true
          }
        }
      }
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error("Update program error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 })
  }
})

export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    
    // Delete related episodes first (cascades should handle this but being explicit)
    await prisma.programEpisode.deleteMany({
      where: { programId: id }
    })
    
    // Update any broadcasts that were linked to this program
    await prisma.liveBroadcast.updateMany({
      where: { programId: id },
      data: { programId: null }
    })
    
    // Delete the program
    await prisma.program.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Program deleted successfully" })
  } catch (error) {
    console.error("Delete program error:", error)
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 })
  }
})