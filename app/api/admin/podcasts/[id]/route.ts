import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// GET /api/admin/podcasts/[id] - Get single podcast
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        transcription: {
          select: {
            id: true,
            content: true,
            language: true,
            format: true
          }
        },
        _count: {
          select: {
            comments: true,
            reviews: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    if (!podcast) {
      return NextResponse.json(
        { error: "Podcast not found" },
        { status: 404 }
      )
    }

    // Add mock data for fields not in schema
    const enhancedPodcast = {
      ...podcast,
      totalPlays: Math.floor(Math.random() * 10000), // Mock plays
      averageRating: 4.2 + Math.random() * 0.8 // Mock rating
    }

    return NextResponse.json(enhancedPodcast)
  } catch (error) {
    console.error("Error fetching podcast:", error)
    return NextResponse.json(
      { error: "Failed to fetch podcast" },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/podcasts/[id] - Update podcast
export const PATCH = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const contentType = req.headers.get('content-type')
    
    const updateData: any = {}
    
    // Handle JSON requests (for status updates)
    if (contentType?.includes('application/json')) {
      const body = await req.json()
      if (body.status) {
        updateData.status = body.status.toUpperCase()
      }
    } else {
      // Handle FormData requests (for full updates)
      const formData = await req.formData()
      
      // Extract form fields
      const title = formData.get("title") as string
      const description = formData.get("description") as string
      const host = formData.get("host") as string
      const guests = formData.get("guests") as string
      const genreId = formData.get("genreId") as string
      const releaseDate = formData.get("releaseDate") as string
      const tags = formData.get("tags") as string
      const status = formData.get("status") as string
      const coverImageId = formData.get("coverImageId") as string
    
      // Debug logging
      console.log("Podcast update - coverImageId received:", coverImageId)
      console.log("Podcast update - all form data:", Array.from(formData.entries()))
      
      if (title) updateData.title = title
      if (description) updateData.description = description
      if (genreId) {
        updateData.genre = {
          connect: { id: genreId }
        }
      }
      if (releaseDate) updateData.releaseDate = new Date(releaseDate)
      if (tags) updateData.tags = tags
      if (status) updateData.status = status.toUpperCase()
    
      // Handle cover image update
      if (coverImageId) {
        console.log("Processing cover image update for asset ID:", coverImageId)
        // Check if the asset exists
        const asset = await prisma.asset.findUnique({
          where: { id: coverImageId }
        })
        
        if (asset) {
          console.log("Asset found, updating coverImage to:", asset.url)
          updateData.coverImage = asset.url
        } else {
          console.log("Asset not found for ID:", coverImageId)
        }
      } else {
        console.log("No coverImageId provided in form data")
      }
      
      // Handle host field
      if (host) {
        updateData.host = host
      }
      
      // Handle guests data
      if (guests) {
        // Check if it's already a plain string or JSON
        if (guests.startsWith('[') || guests.startsWith('{')) {
          try {
            const guestsData = JSON.parse(guests)
            if (Array.isArray(guestsData) && guestsData.length > 0) {
              updateData.guests = guestsData.map(guest => guest.name).join(', ')
            } else {
              updateData.guests = null
            }
          } catch (error) {
            console.error('Error parsing guests data:', error)
            updateData.guests = guests // Use as plain string
          }
        } else {
          updateData.guests = guests // Already a plain string
        }
      }
    }
    
    const podcast = await prisma.podcast.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true,
            reviews: true,
            favorites: true,
            playbackProgress: true
          }
        }
      }
    })

    return NextResponse.json(podcast)
  } catch (error) {
    console.error("Error updating podcast:", error)
    return NextResponse.json(
      { error: "Failed to update podcast" },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/podcasts/[id] - Delete podcast
export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    await prisma.podcast.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting podcast:", error)
    return NextResponse.json(
      { error: "Failed to delete podcast" },
      { status: 500 }
    )
  }
})