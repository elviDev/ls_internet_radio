import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    
    const program = await prisma.program.findUnique({
      where: { 
        slug,
        status: "ACTIVE" // Only show active programs to public
      },
      include: {
        host: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            profileImage: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        episodes: {
          select: {
            id: true,
            title: true,
            description: true,
            audioFile: true,
            duration: true,
            airDate: true
          },
          orderBy: { airDate: "desc" },
          take: 10 // Show last 10 episodes
        },
        _count: {
          select: {
            episodes: true
          }
        }
      }
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    // Transform the data to match the frontend format
    const transformedProgram = {
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      category: formatCategoryForDisplay(program.category),
      schedule: program.schedule,
      image: program.image || `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(program.title)}`,
      status: program.status,
      host: {
        firstName: program.host.firstName,
        lastName: program.host.lastName,
        bio: program.host.bio,
        profileImage: program.host.profileImage
      },
      genre: program.genre ? {
        name: program.genre.name,
        description: program.genre.description
      } : null,
      episodes: program.episodes,
      _count: program._count
    }

    return NextResponse.json(transformedProgram)
  } catch (error) {
    console.error("Error fetching program:", error)
    return NextResponse.json(
      { error: "Failed to fetch program" },
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