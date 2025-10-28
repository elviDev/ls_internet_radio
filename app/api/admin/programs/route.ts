import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { z } from "zod"

const createProgramSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["TALK_SHOW", "MUSIC", "TECHNOLOGY", "BUSINESS", "INTERVIEW", "SPORTS", "NEWS", "ENTERTAINMENT", "EDUCATION"]),
  schedule: z.string().min(1, "Schedule is required"),
  hostId: z.string().min(1, "Host is required"),
  genreId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  image: z.string().optional()
})

export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "12")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || "all"
    const status = searchParams.get("status") || "all"

    const skip = (page - 1) * perPage

    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (category !== "all") {
      where.category = category
    }
    
    if (status !== "all") {
      where.status = status
    }

    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          host: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          genre: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              episodes: true,
              broadcasts: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage
      }),
      prisma.program.count({ where })
    ])

    return NextResponse.json({
      programs,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      }
    })
  } catch (error) {
    console.error("Error fetching programs:", error)
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    )
  }
})

export const POST = adminOnly(async (req: Request) => {
  try {
    const body = await req.json()
    const data = createProgramSchema.parse(body)

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const program = await prisma.program.create({
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

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error("Create program error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 })
  }
})