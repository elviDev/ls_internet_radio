import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// GET /api/admin/podcasts/[id]/comments - Get podcast comments
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "20")
    const skip = (page - 1) * perPage

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: { podcastId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage
      }),
      prisma.comment.count({
        where: { podcastId: id }
      })
    ])

    return NextResponse.json({
      comments,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      }
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/podcasts/[id]/comments - Delete all comments for podcast
export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const result = await prisma.comment.deleteMany({
      where: { podcastId: id }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error) {
    console.error("Error deleting comments:", error)
    return NextResponse.json(
      { error: "Failed to delete comments" },
      { status: 500 }
    )
  }
})