import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

export type StoredFile = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export class UploadValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function storeUpload(file: File): Promise<StoredFile> {
  if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    throw new UploadValidationError(
      `Unsupported file type "${file.type}". Allowed: images and PDF.`,
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new UploadValidationError(
      `File size must be between 1 byte and ${MAX_BYTES / (1024 * 1024)} MB.`,
    );
  }

  await ensureUploadDir();

  const ext = path.extname(file.name) || "";
  const safeId = crypto.randomBytes(16).toString("hex");
  const storedName = `${safeId}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, storedName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, bytes);

  return {
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: storedName, // store relative path only
  };
}

export async function readStoredFile(storagePath: string): Promise<Buffer> {
  const safe = path.basename(storagePath); // prevent path traversal
  const fullPath = path.join(UPLOAD_DIR, safe);
  return fs.readFile(fullPath);
}

export async function deleteStoredFile(storagePath: string) {
  const safe = path.basename(storagePath);
  const fullPath = path.join(UPLOAD_DIR, safe);
  await fs.unlink(fullPath).catch(() => {});
}
