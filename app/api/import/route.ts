import { importData } from "~/server/controllers/import-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(importData);
