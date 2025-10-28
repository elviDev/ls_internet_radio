import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { uploadToS3 } from "@/lib/storage/uploadToS3"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { AssetType } from "@prisma/client"

function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return AssetType.IMAGE;
  if (mimeType.startsWith('audio/')) return AssetType.AUDIO;
  if (mimeType.startsWith('video/')) return AssetType.VIDEO;
  return AssetType.DOCUMENT;
}

function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

async function uploadFileAsAsset(file: File, description: string, tags: string, uploadedById: string) {
  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), "public", "uploads", "assets");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Generate unique filename
  const filename = generateFilename(file.name);
  const filepath = join(uploadDir, filename);

  // Write file to disk
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  // Create asset record in database
  const asset = await prisma.asset.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      type: getAssetType(file.type),
      url: `/uploads/assets/${filename}`,
      description,
      tags,
      uploadedById,
    },
  });

  return asset;
}

// GET /api/admin/podcasts - Get all podcasts with filters and pagination
export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "12")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const genre = searchParams.get("genre") || "all"
    const author = searchParams.get("author") || "all"
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * perPage

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { host: { contains: search, mode: "insensitive" } },
        { guests: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (status !== "all") {
      where.status = status
    }
    
    if (genre !== "all") {
      where.genreId = genre
    }
    
    if (author !== "all") {
      where.authorId = author
    }

    // Get podcasts data
    const [podcasts, totalCount] = await Promise.all([
      prisma.podcast.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          host: true,
          guests: true,
          coverImage: true,
          duration: true,
          releaseDate: true,
          createdAt: true,
          updatedAt: true,
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
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: perPage
      }),
      prisma.podcast.count({ where })
    ])

    // Add calculated fields
    const transformedPodcasts = podcasts.map(podcast => ({
      ...podcast,
      status: "published", // Default status since it's not in schema yet
      totalPlays: Math.floor(Math.random() * 10000), // Mock data
      averageRating: 4.2 + Math.random() * 0.8 // Mock data
    }))

    return NextResponse.json({
      podcasts: transformedPodcasts,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      }
    })
  } catch (error) {
    console.error("Error fetching podcasts:", error)
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    )
  }
})

// POST /api/admin/podcasts - Create new podcast
export const POST = adminOnly(async (req: Request) => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const hostId = formData.get("hostId") as string
    const guests = formData.get("guests") as string
    const genreId = formData.get("genreId") as string
    const releaseDate = formData.get("releaseDate") as string
    const tags = formData.get("tags") as string
    const status = formData.get("status") as string
    const duration = parseInt(formData.get("duration") as string)
    
    const audioFile = formData.get("audioFile") as File
    const coverImage = formData.get("coverImage") as File
    const audioAssetId = formData.get("audioAssetId") as string
    const coverAssetId = formData.get("coverAssetId") as string

    if (!title || !description || !hostId || !genreId || !releaseDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get host information
    const hostStaff = await prisma.staff.findUnique({
      where: { id: hostId },
      select: { firstName: true, lastName: true }
    })

    if (!hostStaff) {
      return NextResponse.json(
        { error: "Host not found" },
        { status: 400 }
      )
    }

    const hostName = `${hostStaff.firstName} ${hostStaff.lastName}`

    // Audio is now handled at episode level, not podcast level
    let audioUrl: string | null = null
    if (audioAssetId) {
      const audioAsset = await prisma.asset.findUnique({
        where: { id: audioAssetId }
      })
      if (audioAsset) {
        audioUrl = audioAsset.url
      }
    } else if (audioFile) {
      // Upload new audio file as asset (for backward compatibility)
      const audioAsset = await uploadFileAsAsset(
        audioFile,
        `Podcast audio: ${title}`,
        'podcast,audio',
        user.id
      )
      audioUrl = audioAsset.url
    }

    // Handle cover image - either use existing asset or upload new file
    let coverImageUrl: string | null = null
    if (coverAssetId) {
      const coverAsset = await prisma.asset.findUnique({
        where: { id: coverAssetId }
      })
      if (coverAsset) {
        coverImageUrl = coverAsset.url
      }
    } else if (coverImage) {
      // Upload new cover image as asset
      const coverAsset = await uploadFileAsAsset(
        coverImage,
        `Podcast cover: ${title}`,
        'podcast,cover',
        user.id
      )
      coverImageUrl = coverAsset.url
    }

    // Parse and format guests data
    let guestsString = null
    if (guests) {
      try {
        const guestsData = JSON.parse(guests)
        if (Array.isArray(guestsData) && guestsData.length > 0) {
          guestsString = guestsData.map(guest => guest.name).join(', ')
        }
      } catch (error) {
        console.error('Error parsing guests data:', error)
      }
    }

    // Create podcast
    const podcast = await prisma.podcast.create({
      data: {
        title,
        description,
        host: hostName,
        guests: guestsString,
        coverImage: coverImageUrl,
        audioFile: audioUrl,
        duration: duration || null,
        releaseDate: new Date(releaseDate),
        tags,
        authorId: user.id,
        genreId
      },
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

    return NextResponse.json(podcast, { status: 201 })
  } catch (error) {
    console.error("Error creating podcast:", error)
    return NextResponse.json(
      { error: "Failed to create podcast" },
      { status: 500 }
    )
  }
})