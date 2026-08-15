import sharp from 'sharp';
import { QACheck } from '@/lib/types';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MIN_WIDTH = 4096;
const MIN_HEIGHT = 2048;
const ASPECT_RATIO_TOLERANCE = 0.1; // ~2:1 with 10% tolerance
const CHECK_TIMEOUT = 60000; // 60 seconds

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(timeoutMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

function getImageBuffer(storagePath: string): Promise<Buffer> {
  // In a real implementation, this would fetch from Supabase Storage
  // For now, we'll use a placeholder that reads from local filesystem
  // The actual implementation should use supabaseAdmin.storage.from('assets').download(storagePath)
  return fetch(`http://localhost:54321/storage/v1/object/public/assets/${storagePath}`)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      return res.arrayBuffer();
    })
    .then(buffer => Buffer.from(buffer));
}

export async function checkFileSize(storagePath: string, fileSize: number): Promise<QACheck> {
  try {
    if (fileSize > MAX_FILE_SIZE) {
      return {
        name: 'File Size',
        status: 'fail',
        message: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds 100MB limit`,
        details: { fileSize, limit: MAX_FILE_SIZE },
      };
    }
    return {
      name: 'File Size',
      status: 'pass',
      message: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB is within 100MB limit`,
      details: { fileSize, limit: MAX_FILE_SIZE },
    };
  } catch (error) {
    return {
      name: 'File Size',
      status: 'fail',
      message: `File size check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function checkDimensions(storagePath: string): Promise<QACheck> {
  try {
    const buffer = await withTimeout(
      getImageBuffer(storagePath),
      CHECK_TIMEOUT,
      'Dimensions check timed out after 60s'
    );

    const metadata = await withTimeout(
      sharp(buffer).metadata(),
      CHECK_TIMEOUT,
      'Dimensions check timed out after 60s'
    );

    const { width, height } = metadata;

    if (!width || !height) {
      return {
        name: 'Image Dimensions',
        status: 'fail',
        message: 'Could not determine image dimensions',
      };
    }

    if (width >= MIN_WIDTH && height >= MIN_HEIGHT) {
      return {
        name: 'Image Dimensions',
        status: 'pass',
        message: `Dimensions ${width}x${height} meet minimum 4096x2048`,
        details: { width, height, minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT },
      };
    }

    return {
      name: 'Image Dimensions',
      status: 'fail',
      message: `Dimensions ${width}x${height} below minimum 4096x2048`,
      details: { width, height, minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT },
    };
  } catch (error) {
    return {
      name: 'Image Dimensions',
      status: 'fail',
      message: `Dimensions check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function checkAspectRatio(storagePath: string): Promise<QACheck> {
  try {
    const buffer = await withTimeout(
      getImageBuffer(storagePath),
      CHECK_TIMEOUT,
      'Aspect ratio check timed out after 60s'
    );

    const metadata = await withTimeout(
      sharp(buffer).metadata(),
      CHECK_TIMEOUT,
      'Aspect ratio check timed out after 60s'
    );

    const { width, height } = metadata;

    if (!width || !height) {
      return {
        name: 'Aspect Ratio',
        status: 'fail',
        message: 'Could not determine image dimensions for aspect ratio',
      };
    }

    const aspectRatio = width / height;
    const targetRatio = 2.0;
    const isValid = Math.abs(aspectRatio - targetRatio) <= ASPECT_RATIO_TOLERANCE;

    if (isValid) {
      return {
        name: 'Aspect Ratio',
        status: 'pass',
        message: `Aspect ratio ${aspectRatio.toFixed(2)}:1 is close to 2:1 (equirectangular)`,
        details: { aspectRatio, targetRatio, tolerance: ASPECT_RATIO_TOLERANCE },
      };
    }

    return {
      name: 'Aspect Ratio',
      status: 'fail',
      message: `Aspect ratio ${aspectRatio.toFixed(2)}:1 deviates from 2:1 (equirectangular)`,
      details: { aspectRatio, targetRatio, tolerance: ASPECT_RATIO_TOLERANCE },
    };
  } catch (error) {
    return {
      name: 'Aspect Ratio',
      status: 'fail',
      message: `Aspect ratio check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function checkEXIF(storagePath: string): Promise<QACheck> {
  try {
    const buffer = await withTimeout(
      getImageBuffer(storagePath),
      CHECK_TIMEOUT,
      'EXIF check timed out after 60s'
    );

    const metadata = await withTimeout(
      sharp(buffer).metadata(),
      CHECK_TIMEOUT,
      'EXIF check timed out after 60s'
    );

    const hasEXIF = !!(metadata.exif && Object.keys(metadata.exif).length > 0);

    if (hasEXIF) {
      return {
        name: 'EXIF Metadata',
        status: 'pass',
        message: 'EXIF metadata present',
        details: { exifKeys: Object.keys(metadata.exif || {}) },
      };
    }

    return {
      name: 'EXIF Metadata',
      status: 'warning',
      message: 'No EXIF metadata found (warning only)',
      details: { exifKeys: [] },
    };
  } catch (error) {
    return {
      name: 'EXIF Metadata',
      status: 'warning',
      message: `EXIF check failed (warning only): ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function checkDecodable(storagePath: string): Promise<QACheck> {
  try {
    const buffer = await withTimeout(
      getImageBuffer(storagePath),
      CHECK_TIMEOUT,
      'Decodable check timed out after 60s'
    );

    // Try to decode the image - this will throw if corrupted
    await withTimeout(
      sharp(buffer).metadata(),
      CHECK_TIMEOUT,
      'Decodable check timed out after 60s'
    );

    return {
      name: 'File Decodable',
      status: 'pass',
      message: 'File can be decoded successfully',
    };
  } catch (error) {
    return {
      name: 'File Decodable',
      status: 'fail',
      message: `File appears corrupted or undecodable: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export type CheckFunction = (storagePath: string, fileSize?: number) => Promise<QACheck>;

export const qaChecks: CheckFunction[] = [
  (storagePath, fileSize) => checkFileSize(storagePath, fileSize || 0),
  checkDimensions,
  checkAspectRatio,
  checkEXIF,
  checkDecodable,
];