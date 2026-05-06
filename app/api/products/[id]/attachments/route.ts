import {
  listProductAttachments,
  uploadProductAttachment,
} from "~/server/controllers/attachment-controller";
import { withApiManager, withApiSession } from "~/server/middleware/auth";

export const GET = withApiSession(listProductAttachments);
export const POST = withApiManager(uploadProductAttachment);
