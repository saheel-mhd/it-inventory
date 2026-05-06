import { importData } from "~/server/controllers/import-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(importData);
