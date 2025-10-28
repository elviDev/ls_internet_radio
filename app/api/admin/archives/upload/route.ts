import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { staffOnly } from "@/lib/auth/staffOnly";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'audio' or 'image'
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["audio", "image"].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file type
    if (type === "audio") {
      const allowedAudioTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/aac",
        "audio/flac",
        "audio/m4a",
      ];
      if (!allowedAudioTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid audio file type" },
          { status: 400 }
        );
      }
    } else if (type === "image") {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid image file type" },
          { status: 400 }
        );
      }
    }

    // Validate file size (100MB for audio, 10MB for images)
    const maxSize = type === "audio" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "archives", type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate file URL
    const fileUrl = `/uploads/archives/${type}/${fileName}`;

    // For audio files, try to extract metadata
    let metadata = null;
    if (type === "audio") {
      try {
        // Basic metadata extraction (in a real app, you'd use a library like node-ffmpeg)
        metadata = {
          filename: file.name,
          size: file.size,
          type: file.type,
          // Duration would be extracted using audio processing library
          // For now, we'll set it as null and let the frontend handle it
          duration: null,
        };
      } catch (error) {
        console.error("Error extracting audio metadata:", error);
      }
    }

    const response = {
      message: "File uploaded successfully",
      file: {
        name: fileName,
        originalName: file.name,
        url: fileUrl,
        type: file.type,
        size: file.size,
        metadata,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// Bulk upload endpoint
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Too many files. Maximum 10 files allowed" },
        { status: 400 }
      );
    }

    const uploadResults = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file type (audio only for bulk upload)
        const allowedAudioTypes = [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/ogg",
          "audio/aac",
          "audio/flac",
          "audio/m4a",
        ];
        
        if (!allowedAudioTypes.includes(file.type)) {
          errors.push({
            file: file.name,
            error: "Invalid audio file type",
          });
          continue;
        }

        // Validate file size (100MB)
        if (file.size > 100 * 1024 * 1024) {
          errors.push({
            file: file.name,
            error: "File size exceeds 100MB limit",
          });
          continue;
        }

        // Create upload directory
        const uploadDir = join(process.cwd(), "public", "uploads", "archives", "audio");
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split(".").pop();
        const fileName = `${timestamp}-${randomString}-${i}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Generate file URL
        const fileUrl = `/uploads/archives/audio/${fileName}`;

        uploadResults.push({
          originalName: file.name,
          fileName,
          url: fileUrl,
          type: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          file: file.name,
          error: "Upload failed",
        });
      }
    }

    return NextResponse.json({
      message: "Bulk upload completed",
      results: {
        successful: uploadResults,
        failed: errors,
        summary: {
          total: files.length,
          successful: uploadResults.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}