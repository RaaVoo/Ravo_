import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET;

export async function getPresignedUrl(key, expiresSec = 3600) {
  if (!key) return null;
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: expiresSec });
}

// 설치 안 했으면: npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner