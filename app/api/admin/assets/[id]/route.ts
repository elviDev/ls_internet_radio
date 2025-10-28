import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";
import { AssetType } from "@prisma/client";

const updateAssetSchema = z.object({
  description: z.string().optional(),
  tags: z.string().optional(),
});

export const GET = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        broadcasts: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            startTime: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Get asset error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
});

export const PATCH = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const data = updateAssetSchema.parse(body);

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.tags !== undefined && { tags: data.tags }),
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

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Update asset error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
});

export const DELETE = adminOnly(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    // Check if asset is being used by any broadcasts
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { broadcasts: true }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset._count.broadcasts > 0) {
      return NextResponse.json(
        { error: "Cannot delete asset that is being used by broadcasts" },
        { status: 400 }
      );
    }

    await prisma.asset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
});