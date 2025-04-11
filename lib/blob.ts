import { put, del } from "@vercel/blob";
import { nanoid } from "nanoid";

// Upload a profile picture to Vercel Blob
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<string> {
  try {
    // Generate a unique filename with user ID and random string
    const filename = `profile-pictures/${userId}/${nanoid()}-${file.name}`;

    // Upload to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    });

    return url;
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw new Error("Failed to upload profile picture");
  }
}

// Delete a profile picture from Vercel Blob
export async function deleteProfilePicture(url: string): Promise<void> {
  try {
    if (!url) return;

    // Extract the pathname from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Delete from Vercel Blob
    await del(pathname);
  } catch (error) {
    console.error("Error deleting from Vercel Blob:", error);
    // We don't throw here to prevent blocking other operations if deletion fails
  }
}
