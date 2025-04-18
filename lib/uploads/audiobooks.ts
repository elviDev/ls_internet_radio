import { uploadToS3 } from "@/lib/storage/uploadToS3"; // wherever your uploadToS3 lives

export async function uploadAudiobookCover(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadToS3(buffer, file.name, file.type, "audiobooks/covers");
}

export async function uploadChapterAudio(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadToS3(buffer, file.name, file.type, "audiobooks/chapters");
}
