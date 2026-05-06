import { listAuditLogs } from "~/server/controllers/audit-log-controller";
import { withApiAdmin } from "~/server/middleware/auth";

export const GET = withApiAdmin(listAuditLogs);
