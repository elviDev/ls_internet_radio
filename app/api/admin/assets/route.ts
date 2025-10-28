import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";
import { AssetType } from "@prisma/client";

const createAssetSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  originalName: z.string().min(1, "Original name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().min(1, "Size is required"),
  type: z.enum(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]),
  url: z.string().url("Valid URL is required"),
  description: z.string().optional(),
  tags: z.string().optional(), // JSON string of tags array
});

export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (type && type !== "all") {
      where.type = type.toUpperCase() as AssetType;
    }
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { broadcasts: true }
          }
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get assets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
});

export const POST = adminOnly(async (req: Request) => {
  try {
    const body = await req.json();
    const data = createAssetSchema.parse(body);

    // Get current user (admin)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const asset = await prisma.asset.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        type: data.type as AssetType,
        url: data.url,
        description: data.description,
        tags: data.tags,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { broadcasts: true }
        }
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Create asset error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
});