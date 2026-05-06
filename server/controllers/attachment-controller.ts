import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { logger } from "~/lib/logger";
import { getCurrentAdmin } from "~/server/auth/session";
import {
  UploadValidationError,
  deleteStoredFile,
  readStoredFile,
  storeUpload,
} from "~/server/services/storage";
import { writeAuditLog } from "~/server/services/audit-log";

type ProductParams = { params: Promise<{ id: string }> };
type AttachmentParams = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export async function listProductAttachments(
  _request: Request,
  { params }: ProductParams,
) {
  const { id } = await params;
  const items = await prisma.attachment.findMany({
    where: { productId: id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      uploadedBy: true,
    },
  });
  return NextResponse.json({ items });
}

export async function uploadProductAttachment(
  request: Request,
  { params }: ProductParams,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, product: true },
  });
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field." }, { status: 400 });
  }

  let stored;
  try {
    stored = await storeUpload(file);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("attachment.upload.failed", { productId: id }, error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const attachment = await prisma.attachment.create({
    data: {
      ...stored,
      productId: id,
      uploadedBy: actor.id,
    },
  });

  await writeAuditLog(prisma, {
    actor,
    action: "ATTACHMENT_UPLOADED",
    entityType: "Product",
    entityId: id,
    summary: `Uploaded "${stored.filename}" to product ${product.product}.`,
    metadata: { attachmentId: attachment.id, sizeBytes: stored.sizeBytes },
  });

  return NextResponse.json(
    {
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedAt: attachment.uploadedAt,
      },
    },
    { status: 201 },
  );
}

export async function downloadAttachment(
  _request: Request,
  { params }: AttachmentParams,
) {
  const { id, attachmentId } = await params;
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, productId: id },
  });
  if (!attachment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const buffer = await readStoredFile(attachment.storagePath);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.filename.replace(/"/g, "")}"`,
    },
  });
}

export async function deleteAttachment(
  _request: Request,
  { params }: AttachmentParams,
) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id, attachmentId } = await params;
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, productId: id },
  });
  if (!attachment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await deleteStoredFile(attachment.storagePath);

  await writeAuditLog(prisma, {
    actor,
    action: "ATTACHMENT_DELETED",
    entityType: "Product",
    entityId: id,
    summary: `Deleted attachment "${attachment.filename}".`,
  });

  return NextResponse.json({ ok: true });
}
