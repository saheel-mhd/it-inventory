import { createStaff } from "~/server/controllers/staff-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createStaff);
