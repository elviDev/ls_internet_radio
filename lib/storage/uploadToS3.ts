import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import { randomUUID } from "crypto";
import mime from "mime-types";

export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  folder: string
) {
  const extension = mime.extension(fileType) || "bin";
  const key = `${folder}/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      ACL: "public-read",
    })
  );

  return {
    url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`,
    key,
  };
}
