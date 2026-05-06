import { updateStaff } from "~/server/controllers/staff-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateStaff);
