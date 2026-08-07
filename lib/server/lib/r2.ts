import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const PART_SIZE = 5 * 1024 * 1024; // 5 MB

export interface CompletedPart {
  ETag: string;
  PartNumber: number;
}

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error('R2_ACCOUNT_ID is not set');
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
  return client;
}

export function resetR2Client() {
  client = null;
}

export function getBucket(): string {
  return process.env.R2_BUCKET || 'viztr';
}

export function getPartSize(): number {
  return PART_SIZE;
}

export async function createMultipartUpload(key: string): Promise<string> {
  const s3 = getR2Client();
  const res = await s3.send(
    new CreateMultipartUploadCommand({ Bucket: getBucket(), Key: key })
  );
  if (!res.UploadId) throw new Error('Failed to initiate multipart upload');
  return res.UploadId;
}

export async function presignUploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn = 3600
): Promise<string> {
  const s3 = getR2Client();
  const command = new UploadPartCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<void> {
  if (!parts || parts.length === 0) {
    throw new Error('completeMultipartUpload requires at least one part');
  }
  const s3 = getR2Client();
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: getBucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: getBucket(),
      Key: key,
      UploadId: uploadId,
    })
  );
}

export async function presignGetObject(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const s3 = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}
