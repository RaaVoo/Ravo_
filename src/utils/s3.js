// 파일 업로드 + 퍼블릭 URL 반환(퍼블릭 버킷이거나, 필요 시 프리사인 URL로 바꿔도 됨)
// backend/utils/s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const PREFIX = process.env.S3_PREFIX || '';

const s3 = new S3Client({ region: REGION });

async function uploadFile(localPath, key, contentType) {
  const Body = fs.createReadStream(localPath);
  const Key = path.posix.join(PREFIX, key).replace(/\\/g, '/');
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key,
    Body,
    ContentType: contentType,
    // ACL: 'public-read', // 버킷이 퍼블릭이면 주석 해제
  }));
  // 퍼블릭 버킷이라면 이렇게 접근 가능
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${Key}`;
  return { key: Key, url };
}

module.exports = { uploadFile };
