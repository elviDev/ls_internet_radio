import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";

export async function deleteFromS3(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
    );
    console.log(`Deleted from S3: ${key}`);
  } catch (error) {
    console.error(`Error deleting from S3: ${key}`, error);
    throw new Error("Failed to delete file from S3");
  }
}
