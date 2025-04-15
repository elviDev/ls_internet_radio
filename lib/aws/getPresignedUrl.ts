import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3Client";
import sharp from "sharp";
import { randomUUID } from "crypto"; // To generate a unique file name for images

// Helper function to process images
async function processImage(buffer: Buffer, contentType: string) {
  if (contentType.startsWith("image")) {
    // Resize and compress the image using Sharp (adjust size as needed)
    return await sharp(buffer)
      .resize(800, 800) // Resize to 800x800 pixels
      .jpeg({ quality: 85 }) // Compress to JPEG with 85% quality
      .toBuffer();
  }
  return buffer;
}

// Function to get a presigned URL for upload and upload to MinIO/S3 bucket
export async function getPresignedUrl(
  filename: string,
  contentType: string,
  fileBuffer: Buffer
) {
  try {
    // Process the image if it's of an image type
    const processedBuffer = await processImage(fileBuffer, contentType);

    // Generate a unique file name if it's an image (use randomUUID to avoid collisions)
    const uniqueFileName = `uploads/${randomUUID()}_${filename}`;

    // Upload to the S3-compatible MinIO bucket (if image, the processed image buffer is used)
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: uniqueFileName,
      Body: processedBuffer,
      ContentType: contentType,
    });

    // Get a presigned URL
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (error: any) {
    throw new Error("Error uploading file to S3/MinIO: " + error.message);
  }
}
