import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

const accountId =
  getRequiredEnv("R2_ACCOUNT_ID")

const accessKeyId =
  getRequiredEnv("R2_ACCESS_KEY_ID")

const secretAccessKey =
  getRequiredEnv("R2_SECRET_ACCESS_KEY")

export const R2_BUCKET_NAME =
  getRequiredEnv("R2_BUCKET_NAME")

export const r2 = new S3Client({
  region: "auto",
  endpoint:
    `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export async function uploadPdf(
  key: string,
  pdf: Buffer,
): Promise<void> {
  await uploadObject(
    key,
    pdf,
    "application/pdf",
  )
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function getPdf(key: string) {
  return r2.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
  )
}

export async function getObject(key: string) {
  return r2.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
  )
}