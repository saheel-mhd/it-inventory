import {
  deleteAttachment,
  downloadAttachment,
} from "~/server/controllers/attachment-controller";
import { withApiManager, withApiSession } from "~/server/middleware/auth";

export const GET = withApiSession(downloadAttachment);
export const DELETE = withApiManager(deleteAttachment);
