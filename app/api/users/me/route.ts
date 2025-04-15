import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/authUtils";
import { getPresignedUrl } from "@/lib/aws/getPresignedUrl";
import sharp from "sharp";
import { randomUUID } from "crypto";
export const GET = async (req: Request) => {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
};

export const PATCH = async (req: Request) => {
  try {
    const body = await req.json();

    // Get the token from the request headers
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode the token and get the user info
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Start with the body data (e.g., name, etc.)
    let updatedUserData = { ...body };

    // Check for updates in user profile image
    if (body.profileImage) {
      const buffer = Buffer.from(body.profileImage.split(",")[1], "base64"); // Assuming base64 encoding

      // Process the image using Sharp (resize, compress, etc.)
      const processedImage = await sharp(buffer)
        .resize(300, 300) // Resize to 300x300 pixels
        .jpeg({ quality: 90 }) // Compress to JPEG with 90% quality
        .toBuffer();

      // Generate a unique filename for the image
      const fileName = `profile-${randomUUID()}.jpg`;

      // Get a presigned URL for the image upload (instead of directly uploading, we get a presigned URL for security)
      const presignedUrl = await getPresignedUrl(
        fileName,
        "image/jpeg",
        processedImage
      );

      // Add the presigned URL to the updated user data for storing in the database
      updatedUserData.profileImage = presignedUrl;
    }

    // Update the user data in the database
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: updatedUserData,
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
};
