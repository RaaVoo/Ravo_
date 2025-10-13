// services/video.access.service.js
import path from "path";
import fs from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = process.env.S3_BUCKET ? new S3Client({ region: process.env.AWS_REGION }) : null;

export const buildVideoAccess = async (v) => {
  if (s3) {
    const cmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: v.file_key, ResponseContentType: v.mime || "video/mp4" });
    const signed_url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
    return { signed_url };
  }
  // 로컬 파일
  const publicBase = process.env.PUBLIC_BASE || ""; // 예: http://localhost:4000
  return { url: `${publicBase}/files/${v.file_key}` };
};
