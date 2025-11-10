import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/programs - Get programs for public display
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get("featured") === "true"
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const programs = await prisma.program.findMany({
      where: {
        status: "ACTIVE" // Only show active programs
      },
      include: {
        host: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            profileImage: true 
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
            episodes: true,
            broadcasts: true
          }
        }
      },
      orderBy: featured 
        ? [
            { broadcasts: { _count: "desc" } }, // Most broadcasts first
            { createdAt: "desc" }
          ]
        : { createdAt: "desc" },
      take: limit
    })

    // Transform the data for the frontend
    const transformedPrograms = programs.map(program => ({
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      category: program.category,
      schedule: program.schedule,
      image: program.image,
      status: program.status,
      host: program.host ? {
        id: program.host.id,
        name: `${program.host.firstName} ${program.host.lastName}`,
        profileImage: program.host.profileImage
      } : null,
      genre: program.genre,
      stats: {
        episodes: program._count.episodes,
        broadcasts: program._count.broadcasts
      },
      createdAt: program.createdAt,
      updatedAt: program.updatedAt
    }))

    return NextResponse.json({
      programs: transformedPrograms,
      count: transformedPrograms.length
    })
  } catch (error) {
    console.error("Error fetching programs:", error)
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    )
  }
}