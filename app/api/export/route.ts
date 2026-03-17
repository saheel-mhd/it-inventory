import { exportData } from "~/server/controllers/export-controller";
import { withApiSession } from "~/server/middleware/auth";

export const GET = withApiSession(exportData);
