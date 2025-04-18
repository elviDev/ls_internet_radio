import { parseBuffer } from "music-metadata";
export async function getAudioDuration(file: File): Promise<number> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await parseBuffer(buffer);
    const duration = metadata.format.duration;
    return Math.floor(duration || 0);
  } catch (error) {
    console.error("Error getting audio duration:", error);
    throw new Error("Failed to get audio duration");
  }
}
