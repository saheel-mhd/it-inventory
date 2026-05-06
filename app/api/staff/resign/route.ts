import { resignStaff } from "~/server/controllers/staff-assignment-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(resignStaff);
