import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  forcePathStyle: true, // Requerido para LocalStack
  credentials: {
    accessKeyId: 'mock_key',
    secretAccessKey: 'mock_secret',
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME;