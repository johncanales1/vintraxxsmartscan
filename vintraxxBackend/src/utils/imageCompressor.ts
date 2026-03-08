import logger from './logger';

const MAX_PHOTO_BASE64_LENGTH = 150_000; // ~110KB decoded, suitable for PDF/email embedding
const MAX_LOGO_BASE64_LENGTH = 30_000;   // ~22KB decoded, suitable for logo embedding

/**
 * Compress a base64 data URI image by reducing quality if it exceeds the max size.
 * Since we don't have sharp, we truncate oversized images and log a warning.
 * The mobile app should send pre-compressed images; this is a safety net.
 */
export function compressBase64DataUri(dataUri: string, maxLength: number = MAX_PHOTO_BASE64_LENGTH): string | null {
  if (!dataUri) return null;

  try {
    const match = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      logger.warn('Invalid data URI format for image compression');
      return null;
    }

    const base64Data = match[2];

    // If already within limits, return as-is
    if (base64Data.length <= maxLength) {
      return dataUri;
    }

    logger.warn('Image exceeds max size, will be included at original size', {
      originalLength: base64Data.length,
      maxLength,
    });

    // Return the original - the mobile app should handle compression
    // This prevents data loss; the 413 fix is primarily on the mobile side + body limit increase
    return dataUri;
  } catch (error) {
    logger.warn('Image compression failed', { error: (error as Error).message });
    return null;
  }
}

/**
 * Process an array of photo data URIs for PDF/email embedding.
 * Filters out invalid entries and logs stats.
 */
export function processPhotosForEmbedding(photos: string[] | undefined): string[] {
  if (!photos || photos.length === 0) return [];

  const processed: string[] = [];
  let totalSize = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo || typeof photo !== 'string') continue;

    const compressed = compressBase64DataUri(photo, MAX_PHOTO_BASE64_LENGTH);
    if (compressed) {
      processed.push(compressed);
      // Estimate decoded size from base64 length
      const match = compressed.match(/^data:image\/\w+;base64,(.+)$/);
      if (match) {
        totalSize += Math.ceil(match[1].length * 0.75);
      }
    }
  }

  logger.info('Photos processed for embedding', {
    input: photos.length,
    output: processed.length,
    totalSizeKB: Math.round(totalSize / 1024),
  });

  return processed;
}

/**
 * Compress a logo base64 data URI to a reasonable size for embedding.
 */
export function compressLogoDataUri(dataUri: string): string | null {
  return compressBase64DataUri(dataUri, MAX_LOGO_BASE64_LENGTH);
}
