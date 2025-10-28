import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function uploadToS3(buffer: Buffer, fileName: string, fileType: string, folder: string) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFileName)

    // Save buffer to file
    await writeFile(filePath, buffer)

    // Return URL that can be accessed publicly
    const url = `/uploads/${folder}/${uniqueFileName}`

    return {
      url,
      key: uniqueFileName,
      bucket: 'local',
      size: buffer.length
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file')
  }
}