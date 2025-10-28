import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || "all"
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {
      status: "ACTIVE" // Only show active programs to public
    }
    
    if (category !== "all") {
      where.category = category.toUpperCase()
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        host: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            episodes: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    // Transform the data to match the frontend format
    const transformedPrograms = programs.map(program => ({
      id: program.id,
      title: program.title,
      slug: program.slug,
      host: `${program.host.firstName} ${program.host.lastName}`,
      schedule: program.schedule,
      image: program.image || "/placeholder.svg?height=300&width=600&text=" + encodeURIComponent(program.title),
      category: formatCategoryForDisplay(program.category),
      description: program.description,
      episodes: program._count.episodes,
      genre: program.genre?.name,
      status: program.status,
      createdAt: program.createdAt
    }))

    return NextResponse.json(transformedPrograms)
  } catch (error) {
    console.error("Error fetching programs:", error)
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    )
  }
}

function formatCategoryForDisplay(category: string): string {
  switch (category) {
    case "TALK_SHOW":
      return "Talk Show"
    case "MUSIC":
      return "Music"
    case "TECHNOLOGY":
      return "Technology"
    case "BUSINESS":
      return "Business"
    case "INTERVIEW":
      return "Interview"
    case "SPORTS":
      return "Sports"
    case "NEWS":
      return "News"
    case "ENTERTAINMENT":
      return "Entertainment"
    case "EDUCATION":
      return "Education"
    default:
      return category
  }
}