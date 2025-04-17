import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // e.g., http://localhost:9000 for MinIO
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Important for MinIO
});

export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  folder: string,
  contentType: string
) {
  const key = `${folder}/${randomUUID()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3.send(command);

  return `https://${process.env.S3_BUCKET_NAME}.${process.env.S3_PUBLIC_DOMAIN}/${key}`;
}
