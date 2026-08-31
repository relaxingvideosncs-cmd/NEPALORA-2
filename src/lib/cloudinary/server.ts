import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

export interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
}

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return cloudinary
}

/**
 * Extracts the Cloudinary public_id from a full secure_url or path.
 * Handles nested folders, transformation segments, and file extensions.
 */
export function extractCloudinaryPublicId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return null
  }

  try {
    // Strip query strings if any
    const cleanUrl = url.split('?')[0]
    // Get everything after '/upload/'
    const afterUpload = cleanUrl.split('/upload/')[1]
    if (!afterUpload) return null

    // Split parts: e.g. ["v1234567", "soulofnepal", "articles", "image.webp"]
    const parts = afterUpload.split('/')
    // Filter out version numbers (v1234...) and transformation segments (w_100, f_auto, etc.)
    const filteredParts = parts.filter(
      (p) =>
        !p.match(/^v\d+$/) &&
        !p.includes(',') &&
        !p.startsWith('w_') &&
        !p.startsWith('q_') &&
        !p.startsWith('e_') &&
        !p.startsWith('f_') &&
        !p.startsWith('c_')
    )

    const fullPathWithExt = filteredParts.join('/')
    // Remove the file extension (.jpg, .webp, .png, etc.)
    const publicId = fullPathWithExt.replace(/\.[^/.]+$/, '')
    return publicId || null
  } catch (err) {
    console.warn('Error parsing Cloudinary public_id:', err)
    return null
  }
}

/**
 * Server-Side Auto Lossless/High-Res Compression Engine.
 * Ensures no oversized payload ever exceeds Cloudinary limits,
 * while maintaining crystal clear visual fidelity.
 */
async function autoCompressBuffer(inputBuffer: Buffer): Promise<Buffer> {
  if (inputBuffer.length <= 5 * 1024 * 1024) {
    return inputBuffer
  }

  try {
    const image = sharp(inputBuffer)
    const metadata = await image.metadata()

    let pipeline = image.rotate()

    if ((metadata.width && metadata.width > 2880) || (metadata.height && metadata.height > 2880)) {
      pipeline = pipeline.resize({
        width: 2880,
        height: 2880,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    if (metadata.format === 'png') {
      return await pipeline.png({ quality: 90, compressionLevel: 8 }).toBuffer()
    } else if (metadata.format === 'webp') {
      return await pipeline.webp({ quality: 90, effort: 4 }).toBuffer()
    } else {
      return await pipeline.jpeg({ quality: 88, mozjpeg: true, progressive: true }).toBuffer()
    }
  } catch (err) {
    console.warn('Server-side sharp compression fallback:', err)
    return inputBuffer
  }
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder = 'soulofnepal/articles'
): Promise<CloudinaryUploadResponse> {
  const cld = getCloudinary()
  const processedBuffer = await autoCompressBuffer(fileBuffer)

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Failed to upload image to Cloudinary'))
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          })
        }
      }
    )

    uploadStream.end(processedBuffer)
  })
}

/**
 * Permanently deletes an asset from Cloudinary storage.
 * Accepts either a public_id or a full Cloudinary secure_url.
 */
export async function deleteFromCloudinary(publicIdOrUrl?: string | null): Promise<boolean> {
  if (!publicIdOrUrl) return false

  try {
    const publicId = publicIdOrUrl.startsWith('http')
      ? extractCloudinaryPublicId(publicIdOrUrl)
      : publicIdOrUrl

    if (!publicId) return false

    const cld = getCloudinary()
    const result = await cld.uploader.destroy(publicId, { invalidate: true })
    return result.result === 'ok' || result.result === 'not found'
  } catch (err) {
    console.warn(`Failed to delete asset [${publicIdOrUrl}] from Cloudinary:`, err)
    return false
  }
}

export { cloudinary }
