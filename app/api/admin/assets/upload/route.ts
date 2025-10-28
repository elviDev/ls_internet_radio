import { NextResponse } from "next/server";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { AssetType } from "@prisma/client";

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

export const POST = adminOnly(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const file = formData.get("file") as File; // Support single file for backward compatibility
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;

    // Determine if this is single or multiple file upload
    const filesToProcess = files.length > 0 ? files : (file ? [file] : []);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Validate number of files (max 20 files at once)
    if (filesToProcess.length > 20) {
      return NextResponse.json({ error: "Too many files. Maximum 20 files allowed per upload" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "assets");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const uploadResults = [];
    const uploadErrors = [];
    const maxSize = 50 * 1024 * 1024; // 50MB per file

    // Process each file
    for (let i = 0; i < filesToProcess.length; i++) {
      const currentFile = filesToProcess[i];
      
      try {
        // Validate file size
        if (currentFile.size > maxSize) {
          uploadErrors.push({
            filename: currentFile.name,
            error: "File too large. Maximum size is 50MB",
            index: i
          });
          continue;
        }

        // Validate file type (basic validation)
        if (!currentFile.type) {
          uploadErrors.push({
            filename: currentFile.name,
            error: "Invalid file type",
            index: i
          });
          continue;
        }

        // Generate unique filename
        const filename = generateFilename(currentFile.name);
        const filepath = join(uploadDir, filename);

        // Write file to disk
        const bytes = await currentFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Create asset record in database
        const asset = await prisma.asset.create({
          data: {
            filename,
            originalName: currentFile.name,
            mimeType: currentFile.type,
            size: currentFile.size,
            type: getAssetType(currentFile.type),
            url: `/uploads/assets/${filename}`,
            description: description || null,
            tags: tags || null,
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

        uploadResults.push(asset);
      } catch (error) {
        console.error(`Error uploading file ${currentFile.name}:`, error);
        uploadErrors.push({
          filename: currentFile.name,
          error: "Failed to upload file",
          index: i
        });
      }
    }

    // Return appropriate response based on results
    if (uploadErrors.length === 0) {
      // All files uploaded successfully
      if (filesToProcess.length === 1) {
        // Single file - return the asset directly for backward compatibility
        return NextResponse.json(uploadResults[0], { status: 201 });
      } else {
        // Multiple files - return array
        return NextResponse.json({
          message: "All files uploaded successfully",
          assets: uploadResults,
          summary: {
            total: filesToProcess.length,
            successful: uploadResults.length,
            failed: 0
          }
        }, { status: 201 });
      }
    } else if (uploadResults.length === 0) {
      // All files failed
      return NextResponse.json({
        error: "All file uploads failed",
        errors: uploadErrors,
        summary: {
          total: filesToProcess.length,
          successful: 0,
          failed: uploadErrors.length
        }
      }, { status: 400 });
    } else {
      // Partial success
      return NextResponse.json({
        message: "Some files uploaded successfully",
        assets: uploadResults,
        errors: uploadErrors,
        summary: {
          total: filesToProcess.length,
          successful: uploadResults.length,
          failed: uploadErrors.length
        }
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch (error) {
    console.error("Upload asset error:", error);
    return NextResponse.json(
      { error: "Failed to upload assets" },
      { status: 500 }
    );
  }
});