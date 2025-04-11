import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { nanoid } from "nanoid";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check for duplicate by comparing file name and size with current profile picture
    if (user?.profilePicture) {
      const currentUrl = new URL(user.profilePicture);
      const currentFilename = currentUrl.pathname.split("/").pop() || "";
      const isDuplicate = currentFilename.includes(file.name);
      if (isDuplicate) {
        return NextResponse.json(
          { message: "Duplicate image. Profile picture is already set." },
          { status: 200 }
        );
      }
    }

    // Compress image using Sharp
    const compressedBuffer = await sharp(buffer)
      .resize(512) // Resize to 512px width (adjust as needed)
      .jpeg({ quality: 80 }) // Compress to JPEG with quality 80
      .toBuffer();

    const filename = `profile-pictures/${
      session.id
    }/${nanoid()}-${file.name.replace(/\s+/g, "_")}.jpeg`;
    const blob = await put(filename, compressedBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    // Delete old profile picture
    if (user?.profilePicture) {
      try {
        const oldUrl = new URL(user.profilePicture);
        const pathname = oldUrl.pathname.substring(1);
        await del(pathname);
      } catch (err) {
        console.warn("Failed to delete old picture:", err);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { profilePicture: blob.url },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "An error occurred during image upload" },
      { status: 500 }
    );
  }
}
