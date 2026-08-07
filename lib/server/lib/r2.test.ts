import {
  S3Client,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PART_SIZE,
  getPartSize,
  createMultipartUpload,
  presignUploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
  presignGetObject,
  deleteObject,
  resetR2Client,
} from './r2';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn().mockResolvedValue({ UploadId: 'mock-upload-id' });
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send })),
    CreateMultipartUploadCommand: jest.fn(),
    CompleteMultipartUploadCommand: jest.fn(),
    UploadPartCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    AbortMultipartUploadCommand: jest.fn(),
  };
});
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mocked-url.example.com/signed'),
}));

const mockSend = jest.fn().mockResolvedValue({ UploadId: 'mock-upload-id' });

jest.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as never));

const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('r2 helpers', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = 'testacct';
    process.env.R2_ACCESS_KEY_ID = 'testkey';
    process.env.R2_SECRET_ACCESS_KEY = 'testsecret';
    process.env.R2_BUCKET = 'test-bucket';
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    resetR2Client();
    mockedGetSignedUrl.mockClear()
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('exports 5MB part size', () => {
    expect(getPartSize()).toBe(PART_SIZE);
    expect(PART_SIZE).toBe(5 * 1024 * 1024);
  });

  it('createMultipartUpload returns an upload id', async () => {
    const uploadId = await createMultipartUpload(
      'tenants/t1/projects/p1/assets/a1/file.glb'
    );
    expect(uploadId).toBe('mock-upload-id');
    expect(CreateMultipartUploadCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'tenants/t1/projects/p1/assets/a1/file.glb',
    });
  });

  it('presignUploadPart returns a signed URL with correct params', async () => {
    const url = await presignUploadPart('key', 'uploadid', 1, 900);
    expect(url).toBe('https://mocked-url.example.com/signed');
    expect(UploadPartCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'key',
      UploadId: 'uploadid',
      PartNumber: 1,
    });
    expect(getSignedUrl).toHaveBeenCalled();
  });

  it('completeMultipartUpload rejects empty parts', async () => {
    await expect(
      completeMultipartUpload('key', 'uploadid', [])
    ).rejects.toThrow('requires at least one part');
  });

  it('completeMultipartUpload accepts valid parts', async () => {
    await expect(
      completeMultipartUpload('key', 'uploadid', [
        { ETag: '"abcetag"', PartNumber: 1 },
      ])
    ).resolves.not.toThrow();
    expect(CompleteMultipartUploadCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: 'test-bucket', UploadId: 'uploadid' })
    );
  });

  it('abortMultipartUpload calls AbortMultipartUploadCommand', async () => {
    await abortMultipartUpload('key', 'uploadid');
    expect(AbortMultipartUploadCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'key',
      UploadId: 'uploadid',
    });
  });

  it('presignGetObject returns a signed URL', async () => {
    const url = await presignGetObject('path/to/file', 1800);
    expect(url).toBe('https://mocked-url.example.com/signed');
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'path/to/file',
    });
  });

  it('deleteObject sends a DeleteObjectCommand', async () => {
    await deleteObject('path/to/file');
    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'path/to/file',
    });
    expect(mockSend).toHaveBeenCalled();
  });
});
